package dev.willcs.optimiser

import scala.Option
import scala.collection.immutable.List
import scala.collection.immutable.HashMap
import scala.collection.Map

import dev.willcs.optimiser.library.MathUtils

object SparseMatrix {
  def identity(n: Int): SparseMatrix = new SparseMatrix(n, n,
    (0 until n).map((index: Int) => 
      new SparseMatrixNode(index, index, 1)))

  def fromRows(rows: Seq[SparseVector]): SparseMatrix = new SparseMatrix(
    rows.head.size, rows.size, (0 until rows.size).flatMap(row =>
      rows(row).map(element =>
        new SparseMatrixNode(row, element.index, element.value)))
  )

  def fromColumns(columns: Seq[SparseVector]): SparseMatrix = new SparseMatrix(
    columns.size, columns.head.size, (0 until columns.size).flatMap(column =>
      columns(column).map(element =>
        new SparseMatrixNode(element.index, column, element.value)))
  )
}

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
    case otherwise: Traversable[SparseMatrixNode] => elements.toList
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
  def set(row: Int, col: Int, value: Double): SparseMatrix = 
    if (value == 0) this.remove(row, col)
    else this.remove(row, col).add(row, col, value)

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
      (matrix, node) => matrix.set(node.row, node.column, node.value)
    )

  /** Incrememnt the values at the given locations by the given increments.
   *  If any locations are out of bounds, their corresponding values will not
   *  be added.
   *  TODO: Implement error handling.
   */
  def increment(increments: Traversable[SparseMatrixNode]): SparseMatrix =
    (this /: increments)(
      (matrix, node) => matrix.increment(node.row, node.column, node.value)
    )

  /** Return the transpose of this matrix. */
  def transpose: SparseMatrix =
    new SparseMatrix(this.columns, this.rows, this.map(
        (node) => new SparseMatrixNode(node.column, node.row, node.value)
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

  def setRow(rowIndex: Int, row: SparseVector): SparseMatrix = 
    (this /: row)(
      (matrix, element) => matrix.set(rowIndex, element.index, element.value)
    )

  def updateRow(rowIndex: Int, update: SparseVector => SparseVector): SparseMatrix =
    this.setRow(rowIndex, update(this.getRow(rowIndex)))

  def getRow(rowIndex: Int): SparseVector = new SparseVector(this.columns, 
    this.matrixList.filter(node => node.row == rowIndex).map((node) => 
      (node.column, node.value)).toMap)

  def getRowsFrom(f: Int): Seq[SparseVector] = this.getRows(f, this.rows)

  def getRowsUntil(u: Int): Seq[SparseVector] = this.getRows(0, u)

  def getRows(f: Int, u: Int): Seq[SparseVector] = this.getRows(f until u)

  def getRows(): Seq[SparseVector] = this.getRowsFrom(0)

  def getRows(range: Seq[Int]): Seq[SparseVector] = 
    range.map(row => this.getRow(row))

  def setColumn(columnIndex: Int, column: SparseVector): SparseMatrix =
    (this /: column)(
      (matrix, element) => matrix.set(element.index, columnIndex, element.value)
    )

  def getColumn(columnIndex: Int): SparseVector = 
    new SparseVector(this.rows, this.matrixList.filter(node => 
      node.column == columnIndex).map((node) =>
        (node.row, node.value)).toMap)

  def getColumns(range: Seq[Int]): Seq[SparseVector] = 
    range.map(column => this.getColumn(column))

  /** Matrix addition */
  def +(that: SparseMatrix): SparseMatrix = this.increment(that)

  def *(that: SparseMatrix): Option[SparseMatrix] = 
    if(this.columns == that.rows)
      Some(new SparseMatrix(this.rows, that.columns,
        (0 until this.rows).map(row =>
          (0 until that.columns).map(column => 
            SparseMatrixNode(row, column, this.getRow(row).dot(that.getColumn(column))
          ))).flatten))
    else None

  /** Compute the LU decomposiiton of this matrix, using the Doolittle
   *  algorithm.
   */
  def decompose(): (SparseMatrix, SparseMatrix) =
    ((new SparseMatrix(this.rows, this.rows), new SparseMatrix(this.rows, this.rows)
      ) /: (0 until this.rows)) {
        case ((l, u), k) => ((newU: SparseMatrix) =>
          (l.setColumn(k, decomposeKthRowToL(k, l, newU)), newU)
        )(u.setRow(k, decomposeKthRowToU(k, l, u)))
      }

  /** Given the the partially computed LU decomposition of this matrix,
   *  compute the kth row of the U component of the LU decomposition.
   */
  private def decomposeKthRowToU(k: Int, l: SparseMatrix, u: SparseMatrix): SparseVector =
    (new SparseVector(this.rows) /: (k until this.rows).map(m => 
      (m, (this.computeUElement(u, l, k, m)))
    )) { 
      case (row, (rowIndex, value)) => row.set(rowIndex, value)
    }

  /** Given the the partially computed LU decomposition of this matrix,
   *  compute the kth column of the L component of the LU decomposition.
   */
  private def decomposeKthRowToL(k: Int, l: SparseMatrix, u: SparseMatrix): SparseVector =
    (new SparseVector(this.rows) /: (k until this.rows).map(i => 
      (i, (this.computeLElement(u, l, i, k)))
    )) { 
      case (column, (columnIndex, value)) => column.set(columnIndex, value)
    }

  /** Compute the element of this matrix's LU decomposition at position (i, k),
   *  in the L component given a certain amount of progress into calculating
   *  the total LU decomposition.
   */
  private def computeLElement(u: SparseMatrix, l: SparseMatrix, i: Int, k: Int): Double = 
    if (i == k) 1 else (this(i, k).get - (0 until k).map(j =>
      l(i, j).get * u(j, k).get
    ).sum) / this.computeUElement(u, l, k, k)

  /** Compute the element of this matrix's LU decomposition at position (k, m),
   *  in the U component given a certain amount of progress into calculating
   *  the total LU decomposition.
   */
  private def computeUElement(u: SparseMatrix, l: SparseMatrix, k: Int, m: Int): Double = 
    this(k, m).get - (0 until k).map(j =>
      l(k, j).get * u(j, m).get
    ).sum

  def invert(): Option[SparseMatrix] = 
    this.decompose() match {
      case (l, u) => (invertL(l), invertU(u)) match {
        case (None, None) | (None, _) | (_, None) => None
        case (Some(lInverse), Some(uInverse)) => 
          uInverse * lInverse
      }
    }

  private def invertL(l: SparseMatrix): Option[SparseMatrix] = 
    (Option(new AugmentedMatrix(l, SparseMatrix.identity(this.rows))) /: (0 until l.rows))(
      (augmented, row) => 
        if(augmented.isEmpty) 
          None
        else
          this.eliminateRowBackwards(augmented.get, row) match {
            case None => None
            case Some(eliminatedRows@_) =>
              this.guassianElimStep(augmented.get, (row until l.rows), eliminatedRows)
          }) match {
            case None => None
            case Some(value@_) => Some(value.augment)
          }

  private def invertU(u: SparseMatrix): Option[SparseMatrix] = 
    (Option(new AugmentedMatrix(u, SparseMatrix.identity(this.rows))) /: (u.rows - 1 to 0 by -1))(
      (augmented, row) => 
        if (augmented.isEmpty)
          None
        else
          this.eliminateRowForwards(augmented.get, row) match {
            case None => None
            case Some(eliminatedRows@_) => {
              this.guassianElimStep(augmented.get, (row to 0 by -1), eliminatedRows)
            }
          }) match {
            case None => None
            case Some(value@_) => Some(value.augment)
          }

  private def guassianElimStep(
    matrix: AugmentedMatrix,
    remainingRows: Iterable[Int],
    augmentedRows: (SparseVector, SparseVector)): Option[AugmentedMatrix] =
      (Option(matrix) /: remainingRows)(
        (augmentedMatrix, row) => 
          if (augmentedMatrix.isEmpty)
            None
          else 
            if (row == remainingRows.head) 
              Some(new AugmentedMatrix(
                augmentedMatrix.get.matrix.setRow(row, augmentedRows._1),
                augmentedMatrix.get.augment.setRow(row, augmentedRows._2)))
            else 
              if (augmentedRows._1.firstIndex.isEmpty)
                None
              else 
                ((factor: Double) => Some(new AugmentedMatrix(
                  augmentedMatrix.get.matrix.updateRow(row, (rowVector) =>
                    this.reduceRowBy(
                      rowVector,
                      augmentedRows._1,
                      factor
                    )),
                  augmentedMatrix.get.augment.updateRow(row, (rowVector) =>
                    this.reduceRowBy(
                      rowVector,
                      augmentedRows._2,
                      factor
                    ))))
                )(augmentedMatrix.get.matrix.getRow(row)(augmentedRows._1.firstIndex.get)))

  private def reduceRowBy(toReduce: SparseVector, by: SparseVector, factor: Double): SparseVector = 
    toReduce - (by * factor)

  private def eliminateRowForwards(
    matrix: AugmentedMatrix,
    row: Int): Option[(SparseVector, SparseVector)] = 
      matrix.matrix.getRow(row).firstValue.map(value =>
        eliminateRow(
          matrix.matrix.getRow(row),
          matrix.augment.getRow(row),
          value))

  private def eliminateRowBackwards(
    matrix: AugmentedMatrix,
    row: Int): Option[(SparseVector, SparseVector)] = 
      matrix.matrix.getRow(row).lastValue.map(value =>
        eliminateRow(
          matrix.matrix.getRow(row),
          matrix.augment.getRow(row),
          value))

  private def eliminateRow(
    matrixRow: SparseVector,
    augmentedRow: SparseVector,
    constant: Double): (SparseVector, SparseVector) = (
      new SparseVector(matrixRow.size, matrixRow.map(element => 
        (element.index, element.value / constant)).toMap),
      new SparseVector(augmentedRow.size, augmentedRow.map(element =>
        (element.index, element.value / constant)).toMap))

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
    this.rebuild(this.matrixList.filter {
          case SparseMatrixNode(`row`, `col`, _) => false
          case _                                 => true
      })

  /** Add a value to the matrix, regardless of whether it not it already exists.
    *  This is only used internally in situations where it's ensured that no
    *  duplicate elements will result from the operation.
    */
  private def add(row: Int, col: Int, value: Double): SparseMatrix =
    this.rebuild(this.matrixList :+ SparseMatrixNode(row, col, value))

  override def toString(): String = (0 until this.rows).map(row =>
    (0 until this.columns).map(column => 
      s"${this(row, column).get}").mkString(" ")).mkString("\n")
}

/** Case class representing a single value in a matrix and its location. */
case class SparseMatrixNode(row: Int, column: Int, value: Double)

class SparseVector(size: Int, elems: Map[Int, Double])
    extends Traversable[SparseVectorElement] {
  private val vectorMap = elems.filter { 
    case (key, value) => value != 0 
 }

  def this(size: Int) = this(size, new HashMap[Int, Double]())

  def apply(index: Int) = 
    if(this.vectorMap.contains(index)) this.vectorMap(index)
    else 0

  def foreach[U](f: SparseVectorElement => U) = (0 until this.size).map(
    index => f(new SparseVectorElement(index, 
      if (this.elems.get(index).isDefined) this.elems.get(index).get
      else 0))
  )

  def set(index: Int, element: Double): SparseVector = element match {
    case 0 => new SparseVector(this.size, this.vectorMap - index)
    case _ => new SparseVector(this.size, this.vectorMap + (index -> element))
  }

  def dot(that: SparseVector): Double = 
    (0D /: (0 until this.size))((total, index) => 
      if (this(index) == 0 || that(index) == 0)
        total
      else
        total + (this(index) * that(index))
    )

  def +(that: SparseVector): SparseVector = new SparseVector(this.size, 
    this.map(element => 
      (element.index, element.value + that(element.index))).toMap)

  def -(that: SparseVector): SparseVector = this + (-that)

  def unary_- : SparseVector = new SparseVector(this.size, this.vectorMap.map { 
    case (key, value) => (key, -value)
  })

  def *(that: Double): SparseVector = new SparseVector(this.size,
    this.map(element =>
      (element.index, element.value * that)).toMap)

  def firstNonZero: Option[SparseVectorElement] = 
    this.find(element => element.value != 0)

  def firstValue: Option[Double] = 
    this.firstNonZero.map(
      element => element.value)

  def firstIndex: Option[Int] =
    this.firstNonZero.map(
      element => element.index)

  def lastNonZero: Option[SparseVectorElement] = 
    this.reversed.find(element => element.value != 0)

  def lastValue: Option[Double] = 
    this.lastNonZero.map(
      element => element.value)

  def lastIndex: Option[Int] =
    this.lastNonZero.map(
      element => element.index)
}

case class SparseVectorElement(index: Int, value: Double)

class AugmentedMatrix(m: SparseMatrix, a: SparseMatrix) {
  val matrix: SparseMatrix = m
  val augment: SparseMatrix = a
}