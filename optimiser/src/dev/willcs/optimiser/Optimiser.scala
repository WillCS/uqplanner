package dev.willcs.optimiser

import org.apache.spark.SparkConf
import org.apache.spark.SparkContext

import dev.willcs.optimiser.library.SortedArrayList

object Optimiser {
  def main(args: Array[String]): Unit = {
    // val sparkConfig: SparkConf = new SparkConf().setAppName("Timetable Optimiser")
    // val sparkContext: SparkContext = new SparkContext(sparkConfig)

    // sparkContext.stop()

    // var matrix = new SparseMatrix(10, 10)
    // matrix = matrix.set(0, 0, 5)
    // println(matrix(0, 1))

    var array: SortedArrayList[SparseMatrixNode] = new SortedArrayList(
      Array(
        new SparseMatrixNode(1, 2, 5.0),
        new SparseMatrixNode(2, 0, 5.0)
      )
    )
    array.foreach(
      (node: SparseMatrixNode) =>
        println(s"(${node.row}, ${node.column}): ${node.value}")
    )
    println("--")
    array = array.insert(new SparseMatrixNode(1, 1, 5.0))
    array.foreach(
      (node: SparseMatrixNode) =>
        println(s"(${node.row}, ${node.column}): ${node.value}")
    )
    println("--")
    array = array.insert(new SparseMatrixNode(1, 3, 5.0))
    array.foreach(
      (node: SparseMatrixNode) =>
        println(s"(${node.row}, ${node.column}): ${node.value}")
    )
    println("--")
    array = array.insert(new SparseMatrixNode(2, 3, 5.0))
    array.foreach(
      (node: SparseMatrixNode) =>
        println(s"(${node.row}, ${node.column}): ${node.value}")
    )
    println("--")
    array = array.insert(new SparseMatrixNode(1, 4, 5.0))
    array.foreach(
      (node: SparseMatrixNode) =>
        println(s"(${node.row}, ${node.column}): ${node.value}")
    )
  }
}
