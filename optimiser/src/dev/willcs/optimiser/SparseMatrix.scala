package dev.willcs.optimiser

// LU Decomposition to invert
import scala.Option
import scala.collection.immutable.List

import dev.willcs.optimiser.library.MathUtils

/** Implementation of a sparse Matrix. i.e. it's optimised for large matrices
  *  with few non-zero elements.
  *
  *  @author Will Stibbards
  */
class SparseMatrix(r: Int, c: Int, elements: Traversable[SparseMatrixNode])
    extends Traversable[SparseMatrixNode] {

  /** The list maintaining the internal representation of the matrix.
    *  Currently based on a standard Scala list, but I'd like to build
    *  some sort of automatically sorted list, hopefully improving
    *  performance.
    */
  private val matrixList: List[SparseMatrixNode] = elements match {
    case already: List[SparseMatrixNode]          => already
    case otherwise: Traversable[SparseMatrixNode] => elements toList
  }

  /** The number of rows in this matrix. */
  val rows: Int = r

  /** The number of columns in this matrix. */
  val columns: Int = c

  /** Constructor for an empty Matrix. We still need to know its size. */
  def this(rows: Int, columns: Int) =
    this(rows, columns, List[SparseMatrixNode]())

  /** Return the value at the given location in the matrix,
    *  or None if the given location is out of bounds.
    */
  def apply(row: Int, col: Int): Option[Double] =
    if (positionInRange(row, col)) this.get(row, col) else None

  /** Put the given value at the given location in the matrix.
    *  If the given location is out of bounds, does nothing.
    *  TODO: implement error handling.
    */
  def set(row: Int, col: Int, value: Double): SparseMatrix = value match {
    case 0 => this.remove(row, col)
    case _ => this.remove(row, col).add(row, col, value)
  }

  /** Increment the value at the given location in the matrix by the given
   *  increment. If the location is out of bounds, does nothing.
   *  TODO: implement error handling.
   */
  def increment(row: Int, col: Int, inc: Double): SparseMatrix = this(row, col) match {
    case None => this
    case Some(value) => this.add(row, col, inc + value)
  }

  /** Put the given values at their respective locations in the matrix.
    *  If any locations are out of bounds, their corresponding values will not
    *  be added.
    *  TODO: Implement error handling.
    */
  def set(elems: Traversable[SparseMatrixNode]): SparseMatrix =
    (this /: elems)(
      (matrix: SparseMatrix, node: SparseMatrixNode) => 
        matrix.set(node.row, node.column, node.value)
    )

  /** Incrememnt the values at the given locations by the given increments.
   *  If any locations are out of bounds, their corresponding values will not
   *  be added.
   *  TODO: Implement error handling.
   */
  def increment(increments: Traversable[SparseMatrixNode]): SparseMatrix =
    (this /: increments)(
      (matrix: SparseMatrix, node: SparseMatrixNode) =>
        matrix.increment(node.row, node.column, node.value)
    )

  /** Return the transpose of this matrix. */
  def transpose: SparseMatrix =
    new SparseMatrix(this.columns, this.rows, this.map(
        (node: SparseMatrixNode) =>
          new SparseMatrixNode(node.column, node.row, node.value)
      ))

  /** From `Traversable`, iterate over every value-location pair in this matrix. */
  def foreach[U](f: SparseMatrixNode => U): Unit = this.matrixList.foreach(f)

  /** Check whether the given position is in the bounds of this matrix.
    *  Returns true if it is, false otherwise.
    */
  def positionInRange(row: Int, col: Int): Boolean =
    MathUtils.valueInRange(row, 0, this.rows) &&
      MathUtils.valueInRange(col, 0, this.columns)

  /** Return whether or not this is a square matrix */
  def isSquare: Boolean = this.rows == this.columns

  /** Matrix addition */
  def +(addend: SparseMatrix): SparseMatrix = this.increment(addend)

  /** Compute the LU decomposiiton of this matrix, using the Doolittle
   *  algorithm.
   */
  def decompose(): (SparseMatrix, SparseMatrix) =
    ((new SparseMatrix(this.rows, this.rows), new SparseMatrix(this.rows, this.rows)
      ) /: (1 to this.rows)) {
        case ((l: SparseMatrix, u: SparseMatrix), k: Int) =>
          this.decomposeKthRow(k, l, u) match { 
            case (newL: SparseMatrix, newU: SparseMatrix) => (l + newL, u + newU) 
          }
      }

  /** Given the first (k - 1) rows of the LU decomposition of this matrix,
   *  compute the kth rows of the LU decomposition.
   */
  private def decomposeKthRow(k: Int, l: SparseMatrix, u: SparseMatrix): (SparseMatrix, SparseMatrix) =
    ((l, u) /: (k to this.rows).map(m => (
      ((k, m), this.computeUElement(u, l, k, m)),
      ((m, k), this.computeLElement(u, l, m, k))
    ))) { 
      case ((l: SparseMatrix, u: SparseMatrix), 
        (((uRow: Int, uCol: Int), uVal: Double), ((lRow: Int, lCol: Int), lVal: Double))) => 
          (u.set(uRow, uCol, uVal), l.set(lRow, lCol, lVal))
    }

  /** Compute the element of this matrix's LU decomposition at position (i, k),
   *  in the L component given a certain amount of progress into calculating
   *  the total LU decomposition.
   */
  private def computeLElement(u: SparseMatrix, l: SparseMatrix, i: Int, k: Int): Double = 
    if (i == k) 1 else (this(i, k).get - (1 until k).map(j =>
      l(i, j).get * u(j, k).get
    ).sum) / this.computeUElement(u, l, k, k)

  /** Compute the element of this matrix's LU decomposition at position (i, k),
   *  in the U component given a certain amount of progress into calculating
   *  the total LU decomposition.
   */
  private def computeUElement(u: SparseMatrix, l: SparseMatrix, k: Int, m: Int): Double =
    this(k, m).get - (1 until k).map(j =>
      l(k, j).get * u(j, m).get
    ).sum

  /** Get the value at the given position in the matrix. This function
    *  doesn't check if the location is valid or not and is pretty much only
    *  used internally inside `apply`.
    */
  private def get(row: Int, col: Int): Option[Double] =
    (Option(0d) /: (this.map {
      case SparseMatrixNode(r, c, value) =>
        if (r == row && c == col) Some(value) else None
    }))((l: Option[Double], r: Option[Double]) => if (r.isEmpty) l else r)

  /** Construct a matrix with a new set of values, but the same size as this one. */
  private def rebuild(elems: Traversable[SparseMatrixNode]): SparseMatrix =
    new SparseMatrix(this.rows, this.columns, elems)

  /** Remove a value from the matrix, effectively setting that value to zero. */
  private def remove(row: Int, col: Int): SparseMatrix =
    this.rebuild(this.matrixList.filter(
      (node: SparseMatrixNode) => node match {
          case SparseMatrixNode(row, col, _) => false
          case _                             => true
      }))

  /** Add a value to the matrix, regardless of whether it not it already exists.
    *  This is only used internally in situations where it's ensured that no
    *  duplicate elements will result from the operation.
    */
  private def add(row: Int, col: Int, value: Double): SparseMatrix =
    this.rebuild(this.matrixList :+ SparseMatrixNode(row, col, value))
}

/** Case class representing a single value in a matrix and its location. */
case class SparseMatrixNode(row: Int, column: Int, value: Double)
