package dev.willcs.optimiser

import org.apache.spark.SparkConf
import org.apache.spark.SparkContext
import org.apache.spark.sql._
 
import com.datastax.spark.connector._
import com.datastax.spark.connector.rdd._
import org.apache.spark.sql.cassandra._

import dev.willcs.optimiser.library.SortedArrayList

import scala.util.Success
import dev.willcs.optimiser.library.Debug
import com.datastax.spark.connector.types.TypeConverter

object Optimiser {
  
  var sparkContext: SparkContext = null

  val CassandraKeyspace: String = "infs3208"

  def registerTypeConverters(): Unit = {
    TypeConverter.registerConverter(TimeToIntConverter)
    TypeConverter.registerConverter(IntToTimeConverter)
  }

  def setSparkContext(spark: SparkContext): Unit = {
    this.sparkContext = spark
  }

  def main(args: Array[String]): Unit = {
    val sparkConfig: SparkConf = new SparkConf()
      .setAppName("Timetable Optimiser")
      .setMaster("local[4]")
      .set("spark.cassandra.connection.host", "192.168.0.45")
      .set("spark.cassandra.connection.port", "9042")
      .set("spark.cassandra.auth.username", "api")            
      .set("spark.cassandra.auth.password", "OPYRtSEe6bowS4MfV0V7p6hYeAYLfaqY")

    this.setSparkContext(new SparkContext(sparkConfig))

    /**
     *  Maximise |3|^T |x_1|
     *           |2|   |x_2|
     *           |0|   |x_3|
     *           |0|   |x_4|
     *           |0|   |x_5|
     *  Subject to:
     *                |x_1|
     *  | 2 1 1 0 0 | |x_2|   |100|
     *  | 1 1 0 1 0 | |x_3| = | 80|
     *  | 1 0 0 0 1 | |x_4|   | 40|
     *                |x_5|
     */
    var constraintMatrix = new SparseMatrix(3, 5)
    constraintMatrix = constraintMatrix.set(0, 0, 2).get.set(0, 1, 1).get.set(0, 2, 1).get
    constraintMatrix = constraintMatrix.set(1, 0, 1).get.set(1, 1, 1).get.set(1, 3, 1).get
    constraintMatrix = constraintMatrix.set(2, 0, 1).get.set(2, 4, 1).get

    val costVector = new SparseVector(5).set(0, 3).set(1, 2)

    val bVector = new SparseVector(3).set(0, 100).set(1, 80).set(2, 40)

    // sparkContext.parallelize(0 until 10).map(index =>
    //   Calendar.genRandomSubject()
    // ).saveToCassandra(CassandraKeyspace, "subject_offering", SomeColumns("name", "classes", "year", "semester"))

    val timetableOptimisationProblem = Debug.doThenPrint(
      Calendar.createLinearProgrammingModel(
        new CalendarConstraints(
          Array(new Time(10, 0), new Time(14, 0), new Time(10, 0), new Time(10, 0), new Time(10, 0)),
          Array(new Time(18, 0), new Time(18, 0), new Time(12, 0), new Time(14, 0), new Time(18, 0)),
          Array(0, 1, 2, 3, 4),
          1,
          false,
          (0 until 3).map(index =>
            Calendar.genRandomSubject()
          )
        )), ((model: LinearProgrammingModel) =>
        Array(
          s"${model.constraintMatrix.rows}x${model.constraintMatrix.columns} Constraint matrix",
          s"${model.constraintMatrix}",
          s"${model.costVector.length}-dimensional Cost vector",
          s"${model.bVector.length}-dimensional B vector",
          s"${model.slackVariables.size} slack variables",
          s"${model.decisionVariables.size} decision variables"
        ).mkString("\n")
      ))

    val simpleLinearProgram = 
      new LinearProgrammingModel(
        constraintMatrix,
        costVector,
        bVector,
        Array(1, 2, 3),
        Array(4, 5)
      )

    RevisedSimplexSolver.solve(simpleLinearProgram) match {
      case Success(value) => 
        println((0 until value.basic.size).map(index =>
          s"x_${value.basic(index) + 1} = ${value.variables(index).get}"
        ).mkString("\n"))
      case failure => println(failure)
    }
    
    sparkContext.stop()
  }
}
