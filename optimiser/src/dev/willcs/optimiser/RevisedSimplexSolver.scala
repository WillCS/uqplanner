import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD

import scala.collection.mutable.Map

import dev.willcs.optimiser.SparseMatrix
import dev.willcs.optimiser.SparseVector

class RevisedSimplexSolver(sparkContext: SparkContext) {
  private val spark = sparkContext

  def solve(model: LinearProgrammingModel): Option[Array[Double]] = None

  private def initialiseVariables(model: LinearProgrammingModel): Option[VariableSet] =
    None

  /** I need to make this nicer but I'm tired. */
  private def doSimplexIteration(
      i: Int,
      model: LinearProgrammingModel,
      variables: VariableSet,
      bInverse: SparseMatrix): Option[VariableSet] =
    this.solveForY(model, variables, bInverse).map(duals => 
      this.getMaxReducedCostIndex(
        this.calculateReducedCosts(model, variables, duals)).map(enteringIndex =>
          this.calculateDirection(enteringIndex, model, bInverse).map(direction =>
            this.multiplyMatByVec(bInverse, model.bVector).map(currentSolution =>
              this.calculateNewBasis(
                enteringIndex, 
                this.getLeavingVariableIndex(model, variables, direction, currentSolution),
                model,
                variables
                ))))).getOrElse(None).getOrElse(None).getOrElse(None)

  private def solveForY(
      model: LinearProgrammingModel,
      variables: VariableSet,
      bInverse: SparseMatrix): Option[SparseVector] =
    this.multiplyMatByVec(bInverse, model.basicCosts(variables))
  
  private def calculateReducedCosts(
      model: LinearProgrammingModel,
      variables: VariableSet,
      y: SparseVector): Seq[Double] =
    spark.parallelize(model.costVector.toSeq).filter(elem =>
      variables.nonbasic.contains(elem.index)).map(elem =>
        elem.value - (spark.parallelize(y.toSeq).zip(
          spark.parallelize(model.constraintsForVar(elem.index).toSeq)).map {
            case (yValue, aValue) => yValue.value * aValue.value
          } sum())).collect()

  private def getMaxReducedCostIndex(reducedCosts: Seq[Double]): Option[Int] =
    reducedCosts.indexOf(reducedCosts.max) match {
      case value@_ => 
        if (value <= 0) None
        else Some(value)
    }

  private def checkFeasibility(variables: VariableSet): Boolean = 
    if (this.spark.parallelize(variables.basic).fold(1)((l, r) => 
      if (r < 0 || l < 0) -1 else 1) == -1)
        false
    else true

  private def calculateDirection(
      enteringIndex: Int,
      model: LinearProgrammingModel,
      bInverse: SparseMatrix): Option[SparseVector] =
    this.multiplyMatByVec(bInverse, model.constraintsForVar(enteringIndex))

  private def getLeavingVariableIndex(
      model: LinearProgrammingModel,
      variables: VariableSet, 
      direction: SparseVector,
      currentSolution: SparseVector): Int =
    spark.parallelize(direction.toSeq).filter(elem =>
      elem.value > 0  
    ).map(elem =>
      (elem.index, currentSolution(elem.index) / elem.value)
    ).reduce {
      case (k1@(index1, value1), k2@(index2, value2)) => if (value1 < value2) k1 else k2
    }._1

  private def calculateNewBasis(
      enteringIndex: Int,
      leavingIndex: Int,
      model: LinearProgrammingModel,
      variables: VariableSet): VariableSet = 
    new VariableSet(
      variables.basic.take(leavingIndex) :+ enteringIndex,
      variables.nonbasic.take(enteringIndex) :+ leavingIndex
    )
    

  private def multiplyMatByVec(matrix: SparseMatrix, vector: SparseVector): Option[SparseVector] =
    if (matrix.rows == vector.size)
      Some(new SparseVector(matrix.columns, spark.parallelize(vector.toSeq).zip(
        spark.parallelize(matrix.getRows())).map {
          case (vectorElem, matRow) => vectorElem.value match {
            case 0 => (vectorElem.index, 0D)
            case _ => (vectorElem.index, spark.parallelize(matRow.toSeq).map(elem =>
              elem.value * vectorElem.value).sum())
          }
        } collectAsMap()))
    else None
}

class LinearProgrammingModel(
    constraints: SparseMatrix,
    costs: SparseVector,
    b: SparseVector) {
  val constraintMatrix: SparseMatrix = constraints
  val costVector: SparseVector = costs
  val bVector: SparseVector = b

  def basicConstraints(variables: VariableSet): SparseMatrix = 
    SparseMatrix.fromColumns(this.constraints.getColumns(variables.basic).toSeq)

  def basicCosts(variables: VariableSet): SparseVector =
    new SparseVector(variables.basic.size, 
      (0 until variables.basic.size).map(index =>
        (index, this.costs(variables.basic(index)))).toMap)

  def constraintsForVar(variable: Int): SparseVector =
    this.constraints.getColumn(variable)

  def numVariables: Int = this.bVector.size
}

class VariableSet(b: Seq[Int], nb: Seq[Int]) {
  val basic = b
  val nonbasic = nb
}