package dev.willcs.optimiser

import scala.Option
import scala.collection.immutable.List
import scala.collection.immutable.HashMap
import scala.collection.Map
import scala.util.{Try, Success, Failure}

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
    extends Traversable[SparseMatrixNode] with Serializable {

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
    *  or an exception if the location is out of bounds
    */
  def apply(row: Int, col: Int): Try[Double] =
    if (positionInRange(row, col)) 
      Success(this.get(row, col).getOrElse(0D))
    else
      Failure(new Exception("Index out of range"))

  /** Put the given value at the given location in the matrix.
    *  If the given location is out of bounds, return an exception.
    */
  def set(row: Int, col: Int, value: Double): Try[SparseMatrix] = 
    if (positionInRange(row, col))
      Success(
        if (value == 0) 
          this.remove(row, col)
        else 
          this.remove(row, col).add(row, col, value)
        )
    else
      Failure(new Exception("Index out of range"))

  /** Increment the value at the given location in the matrix by the given
   *  increment. If the location is out of bounds, return an exception.
   */
  def increment(row: Int, col: Int, inc: Double): Try[SparseMatrix] = 
    this(row, col).map(value => 
      this.add(row, col, inc + value)
    )

  /** Put the given values at their respective locations in the matrix.
    *  If any locations are out of bounds, an exception will be returned.
    */
  def set(elems: Traversable[SparseMatrixNode]): Try[SparseMatrix] =
    (Try(this) /: elems) {
      case (failure@Failure(_), _) => failure
      case (Success(matrix), node) =>
        set(node.row, node.column, node.value)
    }

  /** Incrememnt the values at the given locations by the given increments.
   *  If any locations are out of bounds, their corresponding values will not
   *  be added.
   *  TODO: Implement error handling.
   */
  def increment(increments: Traversable[SparseMatrixNode]): Try[SparseMatrix] =
    (Try(this) /: increments) {
      case (failure@Failure(_), _) => failure
      case (Success(matrix), node) =>
        matrix.increment(node.row, node.column, node.value)
    }

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

  def setRow(rowIndex: Int, row: SparseVector): Try[SparseMatrix] = 
    (Try(this) /: row) {
      case (failure@Failure(_), _) => failure
      case (Success(matrix), element) =>
        matrix.set(rowIndex, element.index, element.value)
    }

  def updateRow(rowIndex: Int, update: SparseVector => SparseVector): Try[SparseMatrix] =
    this.getRow(rowIndex).flatMap(row =>
      this.setRow(rowIndex, update(row))
    )

  def getRow(rowIndex: Int): Try[SparseVector] = 
    if (rowIndex >= 0 && rowIndex < this.rows)
      Success(new SparseVector(this.columns, 
        this.matrixList.filter(node => node.row == rowIndex).map((node) => 
          (node.column, node.value)).toMap))
    else
      Failure(new Exception("Index out of range"))

  def getRowsFrom(f: Int): Try[Seq[SparseVector]] = this.getRows(f, this.rows)

  def getRowsUntil(u: Int): Try[Seq[SparseVector]] = this.getRows(0, u)

  def getRows(f: Int, u: Int): Try[Seq[SparseVector]] = this.getRows(f until u)

  def getRows(): Seq[SparseVector] = this.getRowsFrom(0).get

  def getRows(range: Seq[Int]): Try[Seq[SparseVector]] =
    if (range.min < 0 || range.max >= this.rows)
      Failure(new Exception("Index out of range"))
    else
      Success(range.map(row => this.getRow(row).get))

  def setColumn(columnIndex: Int, column: SparseVector): Try[SparseMatrix] =
    (Try(this) /: column) {
      case (failure@Failure(_), _) => failure
      case (Success(matrix), element) =>
        matrix.set(element.index, columnIndex, element.value)
    }

  def getColumn(columnIndex: Int): Try[SparseVector] = 
    if (columnIndex >= 0 && columnIndex < this.columns)
      Success(new SparseVector(this.rows, this.matrixList.filter(node => 
        node.column == columnIndex).map((node) =>
          (node.row, node.value)).toMap))
    else
      Failure(new Exception("Index out of range"))

  def getColumns(range: Seq[Int]): Try[Seq[SparseVector]] = 
  if (range.min < 0 || range.max >= this.columns)
    Failure(new Exception("Index out of range"))
  else
    Success(range.map(column => this.getColumn(column).get))

  def getColumns(): Seq[SparseVector] =
    this.getColumns(0 until this.columns).get

  /** Matrix addition */
  def +(that: SparseMatrix): Try[SparseMatrix] = this.increment(that)

  def *(that: SparseMatrix): Try[SparseMatrix] =
    if(this.columns == that.rows)
      Success(new SparseMatrix(this.rows, that.columns,
        (0 until this.rows).map(row =>
          (0 until that.columns).map(column =>
            SparseMatrixNode(
              row, 
              column, 
              this.getRow(row).get.dot(that.getColumn(column).get).get
          ))).flatten))
    else Failure(new Exception("Matrix is non-invertible."))

  /** Compute the LU decomposiiton of this matrix, using the Doolittle
   *  algorithm.
   */
  def decompose(): Try[(SparseMatrix, SparseMatrix)] =
    (Try((new SparseMatrix(this.rows, this.rows), new SparseMatrix(this.rows, this.rows))
      ) /: (0 until this.rows)) {
        case (failure@Failure(_), _) => failure
        case (Success((l, u)), k) => (
          u.setRow(k, decomposeKthRowToU(k, l, u)).map(newU =>
            (l.setColumn(k, decomposeKthRowToL(k, l, newU)).get, newU)
          )
        )
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

  def invert(): Try[SparseMatrix] =
    this.decompose() match {
      case Failure(exception) => Failure(exception)
      case Success((l, u)) => {
        invertL(l).flatMap(lInverse => 
          invertU(u).flatMap(uInverse =>
            uInverse * lInverse
          )
        )
      }
    }

  private def invertL(l: SparseMatrix): Try[SparseMatrix] = 
    (Try(new AugmentedMatrix(l, SparseMatrix.identity(this.rows))) /: (0 until l.rows)) {
      case (failure@Failure(_), _) => failure
      case (augmented, row) => 
        this.eliminateRowBackwards(augmented.get, row).flatMap(eliminatedRows =>
          this.guassianElimStep(augmented.get, (row until l.rows), eliminatedRows)
        )
    } map(eliminatedMatrix => 
      eliminatedMatrix.augment
    )

  private def invertU(u: SparseMatrix): Try[SparseMatrix] = 
    (Try(new AugmentedMatrix(u, SparseMatrix.identity(this.rows))
    ) /: (u.rows - 1 to 0 by -1)) {
      case (failure@Failure(_), _) => failure
      case (augmented, row) => 
        this.eliminateRowForwards(augmented.get, row).flatMap(eliminatedRows =>
          this.guassianElimStep(augmented.get, (row to 0 by -1), eliminatedRows)
        )
    } map(eliminatedMatrix =>
      eliminatedMatrix.augment
    )

  private def guassianElimStep(
    matrix: AugmentedMatrix,
    remainingRows: Iterable[Int],
    augmentedRows: (SparseVector, SparseVector)): Try[AugmentedMatrix] =
      (Try(matrix) /: remainingRows) {
        case (failure@Failure(_), _) => failure
        case (augmentedMatrix, row) => 
          if (row == remainingRows.head) 
            for (
              newMatrix <- augmentedMatrix.get.matrix.setRow(row, augmentedRows._1);
              newAugment <- augmentedMatrix.get.augment.setRow(row, augmentedRows._2)
            ) yield new AugmentedMatrix(newMatrix, newAugment)
          else 
            if (augmentedRows._1.firstIndex.isEmpty)
              Failure(
                new Exception(
                  "Empty Row found during Gaussian Elimination - Matrix is non-invertible")
              )
            else 
              augmentedMatrix.get.matrix.getRow(row).flatMap(step =>
                step(augmentedRows._1.firstIndex.get).flatMap(factor =>
                for (
                  newMatrix <- augmentedMatrix.get.matrix.updateRow(row, (rowVector) =>
                    this.reduceRowBy(
                      rowVector,
                      augmentedRows._1,
                      factor
                    )
                  );
                  newAugment <- augmentedMatrix.get.augment.updateRow(row, (rowVector) =>
                    this.reduceRowBy(
                      rowVector,
                      augmentedRows._2,
                      factor
                    )
                  )
                ) yield new AugmentedMatrix(newMatrix, newAugment)
              )
            )
      }

  private def reduceRowBy(toReduce: SparseVector, by: SparseVector, factor: Double): SparseVector = 
    (toReduce - (by * factor)).get

  private def eliminateRowForwards(
    matrix: AugmentedMatrix,
    row: Int): Try[(SparseVector, SparseVector)] = 
      matrix.matrix.getRow(row).flatMap(matrixRow =>
        if (matrixRow.firstValue.isDefined)
          matrix.augment.getRow(row).map(augmentRow =>
            eliminateRow(matrixRow, augmentRow, matrixRow.firstValue.get)
          )
        else Failure(new Exception("Empty row encountered during elimination step of matrix inversion"))
      )

  private def eliminateRowBackwards(
    matrix: AugmentedMatrix,
    row: Int): Try[(SparseVector, SparseVector)] = 
    matrix.matrix.getRow(row).flatMap(matrixRow =>
      if (matrixRow.lastValue.isDefined)
        matrix.augment.getRow(row).map(augmentRow =>
          eliminateRow(matrixRow, augmentRow, matrixRow.lastValue.get)
        )
      else Failure(new Exception("Empty row encountered during elimination step of matrix inversion"))
    )

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
        if (r == row && c == col) 
          Some(value)
        else 
          None
    }))((l: Option[Double], r: Option[Double]) => 
      if (r.isEmpty) l else r
    )

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
case class SparseMatrixNode(row: Int, column: Int, value: Double) extends Serializable

class SparseVector(val length: Int, val elems: Map[Int, Double])
    extends Traversable[SparseVectorElement] with Serializable {
  private val vectorMap = elems.filter { 
    case (key, value) => value != 0 
 }

  def this(length: Int) = this(length, new HashMap[Int, Double]())

  def apply(index: Int): Try[Double] = 
    if (index >= 0 && index < this.length)
      Success(
        if(this.vectorMap.contains(index)) 
          this.vectorMap(index)
        else 0D
      )
    else Failure(new Exception("Index out of range"))

  def foreach[U](f: SparseVectorElement => U) = (0 until this.length).map(
    index => f(new SparseVectorElement(index, 
      if (this.elems.get(index).isDefined) this.elems.get(index).get
      else 0))
  )

  def set(index: Int, element: Double): SparseVector = element match {
    case 0 => new SparseVector(this.length, this.vectorMap - index)
    case _ => new SparseVector(this.length, this.vectorMap + (index -> element))
  }

  def set(elements: Map[Int, Double]): Try[SparseVector] = 
    (Try(this) /: elements) {
      case (failure@Failure(_), _) => failure
      case (Success(vector), element) =>
        Success(vector.set(element._1, element._2))
    }

  def dot(that: SparseVector): Try[Double] =
    if(this.length == that.length)
      Success((0D /: (0 until this.length))((total, index) => 
        if (this(index).get == 0 || that(index).get == 0)
          total
        else
          total + (this(index).get * that(index).get)
      ))
    else Failure(new Exception("Cannot dot mismatched vectors."))

  def indexInRange(index: Int): Boolean =
    index >= 0 && index < this.length

  def +(that: SparseVector): Try[SparseVector] = 
    if (this.length == that.length)
      Success(new SparseVector(this.length, 
        this.map(element => 
          (element.index, element.value + that(element.index).get)).toMap)
      )
    else Failure(new Exception("Cannot add or subtract mismatched vectors."))

  def -(that: SparseVector): Try[SparseVector] = this + (-that)

  def unary_- : SparseVector = new SparseVector(this.length, this.vectorMap.map { 
    case (key, value) => (key, -value)
  })

  def *(that: Double): SparseVector = new SparseVector(this.length,
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

  def nonZeroCount: Int = 
    this.filter(element =>
      element.value != 0).size
}

case class SparseVectorElement(index: Int, value: Double) extends Serializable

class AugmentedMatrix(m: SparseMatrix, a: SparseMatrix) extends Serializable {
  val matrix: SparseMatrix = m
  val augment: SparseMatrix = a
}