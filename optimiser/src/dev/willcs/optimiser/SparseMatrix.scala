package dev.willcs.optimiser

// LU Decomposition to invert
import scala.Option
import scala.collection.immutable.List

import dev.willcs.optimiser.library.MathUtils
import dev.willcs.optimiser.library.SortedArrayList

/** Immutable implementation of a sparse Matrix.
  * i.e. it's optimised for large matrices with few non-zero elements.
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
  private val matrixList: SortedArrayList[SparseMatrixNode] = elements match {
    case already: SortedArrayList[SparseMatrixNode] => already
    case otherwise: Traversable[SparseMatrixNode]   => new SortedArrayList(elements)
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
    *  TODO: this should probably do something else
    */
  def set(row: Int, col: Int, value: Double): SparseMatrix =
    this.remove(row, col).add(row, col, value)

  /** Put the given values at their respective locations in the matrix.
    *  If any locations are out of bounds, their corresponding values will not
    *  be added.
    *  TODO: Make this do something else
    */
  def setAll(elems: Array[SparseMatrixNode]): SparseMatrix =
    (this /: elems)(
      (matrix: SparseMatrix, node: SparseMatrixNode) =>
        node match {
          case SparseMatrixNode(row, col, value) => matrix.set(row, col, value)
        }
    )

  /** From `Traversable`, iterate over every value-location pair in this matrix. */
  def foreach[U](f: SparseMatrixNode => U): Unit = this.matrixList.foreach(f)

  /** Check whether the given position is in the bounds of this matrix.
    *  Returns true if it is, false otherwise.
    */
  def positionInRange(row: Int, col: Int): Boolean =
    MathUtils.valueInRange(row, 0, this.rows) &&
      MathUtils.valueInRange(col, 0, this.columns)

  /** Get the value at the given position in the matrix. This function
    *  doesn't check if the location is valid or not and is pretty much only
    *  used internally inside `apply`.
    */
  private def get(row: Int, col: Int): Option[Double] = (
    (foundNode: SparseMatrixNode) => 
      if (foundNode.row == row && foundNode.column == col)
        Some(foundNode.value)
      else
        None
    )(this.matrixList.findClosest(new SparseMatrixNode(row, col, 0)))

  /** Construct a matrix with a new set of values, but the same size as this one. */
  private def rebuild(elems: Traversable[SparseMatrixNode]): SparseMatrix =
    new SparseMatrix(this.rows, this.columns, elems)

  /** Remove a value from the matrix, effectively setting that value to zero. */
  private def remove(row: Int, col: Int): SparseMatrix =
    this.rebuild(this.matrixList.remove(new SparseMatrixNode(row, col, 0)))

  /** Add a value to the matrix, regardless of whether it not it already exists.
    *  This is only used internally in situations where it's ensured that no
    *  duplicate elements will result from the operation.
    */
  private def add(row: Int, col: Int, value: Double): SparseMatrix =
    this.rebuild(this.matrixList.insert(SparseMatrixNode(row, col, value)))
}

/** Case class representing a single value in a matrix and its location. */
case class SparseMatrixNode(row: Int, column: Int, value: Double) extends Ordered[SparseMatrixNode] {
  def compare(that: SparseMatrixNode): Int = 
    if (this.row > that.row) 
      1
    else if (this.row == that.row)
      if(this.column > that.column) 
        1
      else if (this.column == that.column)
        0
      else
        -1
    else
      -1
}
