package dev.willcs.optimiser

import scala.collection.Set

object Calendar {
  def LectureName = "L"

  def createLinearProgrammingModel(constraints: CalendarConstraints): LinearProgrammingModel = 
    constructModel(
      constraints,
      constructConstraints(
        constraints,
        flattenSubjects(constraints.subjects)
      )
    )

  private def constructModel(
    constraints: CalendarConstraints,
    constraintMatrixAndVector: (SparseMatrix, SparseVector)): LinearProgrammingModel =
      new LinearProgrammingModel(
        constraintMatrixAndVector._1,
        new SparseVector(constraintMatrixAndVector._1.columns),
        constraintMatrixAndVector._2
      )

  private def getNumVariables(
    constraints: CalendarConstraints,
    flattenedStreams: Seq[TimetableStream]): Int = 
      flattenedStreams.length * 3 + constraints.subjects.length

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
      ((constructBinaryConstraints(constraints, flattenedStreams, numVariables) :+
        constructAllStreamsConstraint(constraints, flattenedStreams, numVariables) :+
        constructSubjectCountConstraint(constraints, flattenedStreams, numVariables)) ++
        consutructWholeSubjectConstraints(constraints, flattenedStreams, numVariables) ++
        constructClashConstraints(
          constraints, 
          flattenedStreams, 
          numVariables, 
          calculateClashes(flattenedStreams, constraints.subjects)
        )
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
      Optimiser.sparkContext.parallelize(0 until flattenedStreams.length).map(streamIndex =>
        (
          new SparseVector(numVariables, Array(
            (streamIndex, 1.0),
            (streamIndex + flattenedStreams.length, 1.0)
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
                    -subject.classes.length
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
                (streamIndex + 2 * flattenedStreams.length, 1.0 * flattenedStreams.length)
              )
            else
              Array((secondaryStreamIndex,
                if (clashes(flattenedStreams(streamIndex), flattenedStreams(secondaryStreamIndex)))
                  1.0
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
      ))
}

class Time(
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

class ClassSession(
  val startTime: Time,
  val endTime: Time,
  val location: String,
  val day: Int
) extends Serializable {
  def clashesWith(that: ClassSession): Boolean =
    if(this == that)
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

class ClassStream(
  val weeks: Seq[Int],
  val classes: Seq[ClassSession]
) extends Serializable {
  def clashesWith(that: ClassStream): Boolean =
    if(this == that || this.weeks.intersect(that.weeks).isEmpty)
      false
    else 
      Optimiser.sparkContext.parallelize(this.classes).map(thisSession =>
        Optimiser.sparkContext.parallelize(that.classes).map(thatSession =>
          thisSession.clashesWith(thatSession)
        ).filter(clashes => clashes).collect()
      ).filter(clashes => clashes.nonEmpty).count() == 0
}

class ClassType(
  val name: String,
  val streams: Seq[Option[ClassStream]]
) extends Serializable

class Subject(
  val name: String,
  val classes: Seq[Option[ClassType]]
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
