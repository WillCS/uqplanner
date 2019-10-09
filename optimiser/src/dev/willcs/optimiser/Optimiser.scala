package dev.willcs.optimiser

import org.apache.spark.SparkConf
import org.apache.spark.SparkContext

import dev.willcs.optimiser.library.SortedArrayList
import scala.util.Success

object Optimiser {
  var sparkContext: SparkContext = null

  def main(args: Array[String]): Unit = {
    val sparkConfig: SparkConf = new SparkConf().setAppName("Timetable Optimiser").setMaster("local[4]")
    this.sparkContext = new SparkContext(sparkConfig)

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

    RevisedSimplexSolver.solve(new LinearProgrammingModel(
      constraintMatrix,
      costVector,
      bVector
    )) match {
      case Success(value) => 
        println((0 until value.basic.size).map(index =>
          s"x_${value.basic(index) + 1} = ${value.variables(index).get}"
        ).mkString("\n"))
      case failure => println(failure)
    }
    
    sparkContext.stop()
  }
}
