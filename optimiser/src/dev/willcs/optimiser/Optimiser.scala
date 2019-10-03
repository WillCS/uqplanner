package dev.willcs.optimiser

import org.apache.spark.SparkConf
import org.apache.spark.SparkContext

import dev.willcs.optimiser.library.SortedArrayList

object Optimiser {
  def main(args: Array[String]): Unit = {
    // val sparkConfig: SparkConf = new SparkConf().setAppName("Timetable Optimiser").setMaster("local[4]")
    // val sparkContext: SparkContext = new SparkContext(sparkConfig)

    // sparkContext.stop()

    var matrix = new SparseMatrix(3, 3)
    matrix = matrix.increment(0, 0, 5)
    matrix = matrix.increment(0, 1, 2)
    matrix = matrix.increment(1, 0, 29)
    matrix = matrix.increment(1, 1, 4)
    matrix = matrix.increment(0, 2, 11)
    matrix = matrix.increment(2, 0, 15)
    matrix = matrix.increment(2, 1, 7)
    matrix = matrix.increment(1, 2, 12)
    matrix = matrix.increment(2, 2, 19)
    println("Matrix")
    println(matrix)

    val (l, u) = matrix.decompose()

    println("U")
    println(u)
    
    val uInverse = matrix.invertU(u)
    println("Identity")
    println(uInverse)

    // val inverse = matrix.invert()
    // println("Inverse")
    // println(inverse.get)

    // println("Test")
    // println(matrix * SparseMatrix.identity(3))
  }
}
