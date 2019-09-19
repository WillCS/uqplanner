package dev.willcs.optimiser

import org.apache.spark.SparkConf
import org.apache.spark.SparkContext

import dev.willcs.optimiser.library.SortedArrayList

object Optimiser {
  def main(args: Array[String]): Unit = {
    // val sparkConfig: SparkConf = new SparkConf().setAppName("Timetable Optimiser").setMaster("local[4]")
    // val sparkContext: SparkContext = new SparkContext(sparkConfig)

    // sparkContext.stop()

    var matrix = new SparseMatrix(10, 10)
    matrix = matrix.set(0, 0, 5)
    println(matrix(0, 0))
  }
}
