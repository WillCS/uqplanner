package dev.willcs.optimiser

import scala.collection.Set
import scala.util.Random
import dev.willcs.optimiser.library.Debug
import com.datastax.driver.core.schemabuilder.UDTType
import com.datastax.driver.mapping.annotations.UDT
import com.datastax.driver.mapping.annotations.Table
import com.datastax.spark.connector.types.TypeConverter
import java.time.Instant
import java.time.ZoneId
import java.time.LocalTime

object Calendar {
  def LectureName = "L"

  def ClassTypes = Array(
    Array(
      Map(
        ("name", "L"),
          ("streams", Map( 
            ("min", 1),
            ("max", 3) 
          )),
          ("length", Map( 
            ("hours", 0),
            ("minutes", 50)
          )),
          ("sessions", 3)
      ), Map(
        ("name", "T"),
        ("streams", Map( 
          ("min", 4),
          ("max", 8)
        )),
        ("length", Map( 
          ("hours", 0),
          ("minutes", 50)
        )),
        ("sessions", 1)
      ), Map(
        ("name", "P"),
        ("streams", Map(
          ("min", 4),
          ("max", 8)
        )),
        ("length", Map(
          ("hours", 1),
          ("minutes", 20)
        )),
        ("sessions", 1)
      )
    ), Array(
      Map(
        ("name", "U"),
        ("streams", Map(
          ("min", 2),
          ("max", 5)
        )),
        ("length", Map(
          ("hours", 2),
          ("minutes", 50)
        )),
        ("sessions", 1)
      ), Map(
        ("name", "L"),
        ("streams", 1),
        ("length", Map(
          ("hours", 0),
          ("minutes", 50)
        )),
        ("sessions", 1)
      )
    ), Array(
      Map(
        ("name", "L"),
        ("streams", Map(
          ("min", 1),
          ("max", 2)
        )),
        ("length", Map(
          ("hours", 1),
          ("minutes", 50)
        )),
        ("sessions", 1)
      ), Map(
        ("name", "P"),
        ("streams", Map(
          ("min", 3),
          ("max", 6)
        )),
        ("length", Map(
          ("hours", 1),
          ("minutes", 50)
        )),
        ("sessions", 1)
      )
    )
  )

  def createLinearProgrammingModel(constraints: CalendarConstraints): LinearProgrammingModel = 
    constructModelWithFlattenedSubjects(
      constraints,
      flattenSubjects(constraints.subjects)
    )

  def constructModelWithFlattenedSubjects(
    constraints: CalendarConstraints,
    flattenedSubjects: Seq[TimetableStream]): LinearProgrammingModel =
      constructModel(
        constraints,
        flattenedSubjects.length,
        constructConstraints(
          constraints,
          flattenedSubjects
        )
      )

  private def constructModel(
    constraints: CalendarConstraints,
    numBasicVariables: Int,
    constraintMatrixAndVector: (SparseMatrix, SparseVector)): LinearProgrammingModel =
      new LinearProgrammingModel(
        constraintMatrixAndVector._1,
        new SparseVector(constraintMatrixAndVector._1.columns),
        constraintMatrixAndVector._2,
        (0 until numBasicVariables) ++ (0 until constraints.subjects.length).map(subjectIndex =>
          numBasicVariables * 3 + subjectIndex  
        ),
        (numBasicVariables until numBasicVariables * 3) ++ 
          (numBasicVariables * 3 + constraints.subjects.length until numBasicVariables * 3 + constraints.subjects.length * 2)
      )

  private def getNumVariables(
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream]): Int = 
      flattenedStreams.length * 3 + constraints.subjects.length * 2

  private def constructConstraints(
    constraints: CalendarConstraints, 
    flattenedStreams: Seq[TimetableStream]): (SparseMatrix, SparseVector) = 
      constructConstraintMatrixAndVector(
        constructConstraintsAsRows(
          constraints,
          flattenedStreams,
          getNumVariables(constraints, flattenedStreams)
        ).unzip
      )

  private def constructConstraintMatrixAndVector(
    unzipped: (Seq[SparseVector], Seq[Double])): (SparseMatrix, SparseVector) = unzipped match {
      case (matrixRows, vectorElems) =>
      (
        SparseMatrix.fromRows(matrixRows), 
        new SparseVector(
          vectorElems.length, 
          vectorElems.indices.map(index =>
            (index, vectorElems(index))
          ).toMap
        )
      )
    }

  private def constructConstraintsAsRows(
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream],
    numVariables: Int): Seq[(SparseVector, Double)] = 
      ((Debug.doThenPrint(
        constructBinaryConstraints(constraints, flattenedStreams, numVariables),
          ((constraints: Seq[(SparseVector, Double)]) =>
            s"Added ${constraints.length} constraints."
          )
       ) :+
        Debug.doThenPrint(
          constructAllStreamsConstraint(constraints, flattenedStreams, numVariables),
          ((u: Any) => "Added 1 constraint.")
        ) :+
        Debug.doThenPrint(
          constructSubjectCountConstraint(constraints, flattenedStreams, numVariables),
          ((u: Any) => s"Added 1 constraint."
          ))) ++
        Debug.doThenPrint(
          consutructWholeSubjectConstraints(constraints, flattenedStreams, numVariables),
          ((constraints: Seq[(SparseVector, Double)]) =>
            s"Added ${constraints.length} constraints."
          )) ++
        Debug.doThenPrint(
          constructClashConstraints(
            constraints, 
            flattenedStreams, 
            numVariables, 
            calculateClashes(flattenedStreams, constraints.subjects)
          ),((constraints: Seq[(SparseVector, Double)]) =>
          s"Added ${constraints.length} constraints."
        ))
      )

  private def constructAllStreamsConstraint (
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream],
    numVariables: Int): (SparseVector, Double) = (
      new SparseVector(
        numVariables,
        (0 until flattenedStreams.size).map(subjectIndex =>
          (subjectIndex, 1.0 / (flattenedStreams(subjectIndex).getSubject(constraints.subjects).classes.size))
        ).toMap
      ),
      constraints.subjectCount
    )

  private def constructSubjectCountConstraint(
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream],
    numVariables: Int): (SparseVector, Double) = (
      new SparseVector(
        numVariables,
        (0 until constraints.subjects.length).map(subjectIndex =>
          (subjectIndex + flattenedStreams.length * 3, 1.0)
        ).toMap
      ),
      constraints.subjectCount
    )

  private def constructBinaryConstraints(
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream],
    numVariables: Int): Seq[(SparseVector, Double)] =
      Optimiser.sparkContext.parallelize(
        (0 until flattenedStreams.length) ++ (flattenedStreams.length * 3 until flattenedStreams.length * 3 + constraints.subjects.length)
      ).map(streamIndex =>
        (
          new SparseVector(
            numVariables,
            Array(
              (streamIndex, 1.0),
              (streamIndex + 
                (if (streamIndex < flattenedStreams.length) 
                  flattenedStreams.length
                else
                  constraints.subjects.length
                ), 1.0)
            ).toMap),
          1.0
        )
      ).collect().toSeq

  private def consutructWholeSubjectConstraints(
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream],
    numVariables: Int): Seq[(SparseVector, Double)] =
      Optimiser.sparkContext.parallelize(constraints.subjects).map(subject =>
        (
          new SparseVector(
            numVariables,
            (0 until numVariables).map(variableIndex =>
              (variableIndex, 
                if (variableIndex < flattenedStreams.length)
                  1.0
                else if (variableIndex >= flattenedStreams.length * 3)
                  if (variableIndex == flattenedStreams.length * 3 + (constraints.subjects.indexOf(subject)))
                    -subject.classes.size
                  else
                    0.0
                else
                  0.0
              )
            ).toMap
          ), 
        0.0)
      ).collect().toSeq

  private def constructClashConstraints(
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream],
    numVariables: Int,
    clashes: Map[(TimetableStream, TimetableStream), Boolean]): Seq[(SparseVector, Double)] =
      Optimiser.sparkContext.parallelize(0 until flattenedStreams.length).map(streamIndex =>(
        new SparseVector(
          numVariables,
          ((0 until flattenedStreams.length)).flatMap(secondaryStreamIndex =>
            if (secondaryStreamIndex == streamIndex)
              Array(
                (streamIndex, 1.0 * flattenedStreams.length),
                (streamIndex + 2 * flattenedStreams.length, 1.0)
              )
            else
              Array((secondaryStreamIndex,
                if (clashes.contains((flattenedStreams(streamIndex), flattenedStreams(secondaryStreamIndex))))
                  if (clashes((flattenedStreams(streamIndex), flattenedStreams(secondaryStreamIndex))))
                    1.0
                  else
                    0.0
                else
                  0.0
              ))
          ).toMap
        ), 1.0 * flattenedStreams.length
      )).collect().toSeq

  private def preSolve(constraints: CalendarConstraints): CalendarConstraints = 
    new CalendarConstraints(
      constraints.startTimes,
      constraints.endTimes,
      constraints.days,
      constraints.subjectCount,
      constraints.attendingLectures,
      constraints.subjects.map(subject => 
        prune(
          subject,
          constraints.startTimes,
          constraints.endTimes,
          constraints.days,
          constraints.attendingLectures
        )
      )
    )

  private def calculateClashes(
    streams: Seq[TimetableStream],
    subjects: Seq[Subject]): Map[(TimetableStream, TimetableStream), Boolean] =
      Optimiser.sparkContext.parallelize(streams).zip(
        Optimiser.sparkContext.parallelize(streams)).map(streamPair =>
          (
            streamPair, 
            streamPair._1.getStream(subjects).clashesWith(streamPair._2.getStream(subjects))
          )
      ).collect().toMap

  private def flattenSubjects(subjects: Seq[Subject]): Seq[TimetableStream] = 
    subjects.map(subject =>
      subject.classes.filter(classType =>
        classType.isDefined
      ).map(classType =>
        (0 until classType.get.streams.size).filter(streamIndex => 
          classType.get.streams(streamIndex).isDefined
        ).map(streamIndex =>
          new TimetableStream(
            subject.name,
            classType.get.name,
            streamIndex
          )
        )
      ).flatten
    ).flatten

  private def prune(
    subject: Subject,
    startTimes: Seq[Time],
    endTimes: Seq[Time],
    days: Seq[Int],
    attendingLectures: Boolean): Subject = 
      new Subject(subject.name, subject.classes.map(classType =>
        if (classType.isEmpty || (!attendingLectures && classType.get.name == LectureName))
          None
        else
          Some(new ClassType(
            classType.get.name,
            classType.get.streams.map(optionStream =>
              optionStream.flatMap(stream =>
                if (stream.classes.exists(session =>
                  days.contains(session.day) ||
                  startTimes(session.day).toMinutes() > session.startTime.toMinutes() ||
                    endTimes(session.day).toMinutes() < session.endTime.toMinutes()
                )) 
                  None
                else
                  Some(stream)
              )
            )
          ))
      ).filter(optionalClassType =>
        optionalClassType.isDefined
      ),
      subject.year,
      subject.semester
    )

  def genRandomSubject(): Subject =
    new Subject(
      Random.nextString(4)
        + Random.nextInt(10).toString()
        + Random.nextInt(10).toString()
        + Random.nextInt(10).toString()
        + Random.nextInt(10).toString(),
      ClassTypes(Random.nextInt(ClassTypes.length)).map(classData =>
        Some(genRandomClass(classData))
      ).toSet,
      2019,
      2
    )

  def genRandomClass(classData: Map[String, Any]): ClassType =
    new ClassType(
      classData("name").toString(),
      (0 until (
        if (classData("streams").isInstanceOf[Int])
          classData("streams").asInstanceOf[Int]
        else
          classData("streams").asInstanceOf[Map[String, Any]]("min").asInstanceOf[Int] +
            Random.nextInt(
              classData("streams").asInstanceOf[Map[String, Any]]("max").asInstanceOf[Int] -
                classData("streams").asInstanceOf[Map[String, Any]]("min").asInstanceOf[Int]
            )
      )).map(classIndex =>
        Some(genRandomStream(classData))
      ).toList
    )

  def genRandomStream(classData: Map[String, Any]): ClassStream =
    new ClassStream(
      Set[Int](),
      (0 until classData("sessions").asInstanceOf[Int]).map(sessionIndex =>
        genRandomSession(
          new Time(8 + Random.nextInt(10), 0),
          timeFromMap(classData("length").asInstanceOf[Map[String, Int]])
        )
      ).toList
    )

  def genRandomSession(startTime: Time, length: Time): ClassSession =
    new ClassSession(
      startTime,
      startTime + length,
      Random.nextString(20),
      Random.nextInt(5)
    ) 

  private def timeFromMap(map: Map[String, Int]): Time =
    new Time(map("hours"), map("minutes"))
}


case class Time(
  val hours: Int, 
  val minutes: Int) extends Serializable {
    def +(that: Time): Time = 
      ((thisTotalMins: Int, thatTotalMins: Int) =>
        new Time(
          (thisTotalMins + thatTotalMins -
            ((thisTotalMins + thatTotalMins) % 60)) / 60,
          (thisTotalMins + thatTotalMins) % 60
        )
      )(
        this.toMinutes(),
        that.toMinutes()
      )

    def toMinutes(): Int =
      this.hours * 60 + this.minutes
}

object TimeToIntConverter extends TypeConverter[java.lang.Integer] {
  def targetTypeTag = reflect.runtime.universe.typeTag[Integer]
  def convertPF = {
    case t: Time => t.toMinutes() * 60
  }
}

object IntToTimeConverter extends TypeConverter[Time] with Serializable {
  def targetTypeTag = reflect.runtime.universe.typeTag[Time]
  def convertPF = {
    case t: java.lang.Integer => new Time((t - t % 60) / 60, t % 60)
  }
}

@UDT(name = "class_session")
case class ClassSession(
  val startTime: Time,
  val endTime: Time,
  val location: String,
  val day: Int
) extends Serializable {
  def clashesWith(that: ClassSession): Boolean =
    if (this == that)
      false
    else ((thisStart: Int, thatStart: Int, thisEnd: Int, thatEnd: Int) =>
      (thisStart <= thatStart && thisEnd > thatStart && thisEnd <= thatEnd) ||
        (thatStart <= thisStart && thatEnd > thisStart && thatEnd <= thisEnd) ||
        (thisStart <= thatStart && thisEnd >= thatEnd) ||
        (thatStart <= thisStart && thatEnd >= thisEnd)
    )(
      this.startTime.toMinutes(),
      that.startTime.toMinutes(), 
      this.endTime.toMinutes(),
      that.endTime.toMinutes()
    )
}

@UDT(name = "class_stream")
case class ClassStream(
  val weeks: Set[Int],
  val classes: List[ClassSession]
) extends Serializable {
  def clashesWith(that: ClassStream): Boolean =
    if (this == that || this.weeks.intersect(that.weeks).isEmpty)
      false
    else 
      Optimiser.sparkContext.parallelize(this.classes).flatMap(thisSession =>
        Optimiser.sparkContext.parallelize(that.classes).map(thatSession =>
          thisSession.clashesWith(thatSession)
        ).collect()
      ).filter(clashes => clashes).count() != 0
}

@UDT(name = "class")
case class ClassType(
  val name: String,
  val streams: List[Option[ClassStream]]
) extends Serializable

@Table(name = "subject_offering")
case class Subject(
  val name: String,
  val classes: Set[Option[ClassType]],
  val year: Int,
  val semester: Int
) extends Serializable

class TimetableStream(
  val subjectName: String,
  val typeName: String,
  val streamIndex: Int
) extends Serializable {
  def getSubject(subjects: Seq[Subject]): Subject =
    subjects.find(subject =>
      subject.name.equals(this.subjectName)
    ).get

  def getType(subjects: Seq[Subject]): ClassType =
    this.getSubject(subjects).classes.find(optionalClass =>
      optionalClass.map(classType =>
        classType.name.equals(this.typeName)
      ).exists(doesEqual => doesEqual)
    ).get.get

  def getStream(subjects: Seq[Subject]): ClassStream =
    this.getType(subjects).streams(this.streamIndex).get
}

class CalendarConstraints(
  val startTimes: Seq[Time],
  val endTimes: Seq[Time],
  val days: Seq[Int],
  val subjectCount: Int,
  val attendingLectures: Boolean,
  val subjects: Seq[Subject]
) extends Serializable
