import org.apache.spark.SparkContext

import scala.collection.mutable.Map

import dev.willcs.optimiser.SparseMatrix
import dev.willcs.optimiser.SparseVector
import dev.willcs.optimiser.Optimiser

object RevisedSimplexSolver {
  def solve(model: LinearProgrammingModel): Option[SparseVector] = 
    initialiseVariables(model).flatMap(variables =>
      calculateNewBInverse(model, variables).flatMap(bInverse =>
        doSimplexIteration(
          model,
          variables,
          bInverse))).map(variableSet =>
            variableSet.variables
          )

  private def initialiseVariables(model: LinearProgrammingModel): Option[VariableSet] =
    None

  private def doSimplexIteration(
    model: LinearProgrammingModel,
    variables: VariableSet,
    bInverse: SparseMatrix): Option[VariableSet] =
        getMaxReducedCostIndex(
          calculateReducedCosts(
            model,
            variables,
            calculateDualVariables(model, variables, bInverse))
        ) match {
          case None => Some(variables)
          case Some(enteringIndex) =>
            getLeavingVariableIndex(
              model,
              variables,
              calculateDirection(enteringIndex, model, bInverse)
            ).flatMap(leavingIndex =>
              completeSimplexIteration(
                model,
                getNewBasis(leavingIndex, enteringIndex, variables)))
        }

  private def completeSimplexIteration(
    model: LinearProgrammingModel,
    newBasis: VariableSet): Option[VariableSet] =
      calculateNewBInverse(model, newBasis).flatMap(newBInverse =>
        doSimplexIteration(
          model,
          new VariableSet(
            newBasis.basic,
            newBasis.nonbasic,
            calculateNewSolution(model, newBInverse)),
          newBInverse))

  private def calculateDualVariables(
    model: LinearProgrammingModel,
    variables: VariableSet,
    bInverse: SparseMatrix): SparseVector =
      multiplyMatByVec(bInverse, model.basicCosts(variables))
  
  private def calculateReducedCosts(
    model: LinearProgrammingModel,
    variables: VariableSet,
    y: SparseVector): Seq[Double] =
      Optimiser.sparkContext.parallelize(model.costVector.toSeq).filter(elem =>
        variables.nonbasic.contains(elem.index)).map(elem =>
          elem.value - (Optimiser.sparkContext.parallelize(y.toSeq).zip(
            Optimiser.sparkContext.parallelize(model.constraintsForVar(elem.index).toSeq)).map {
              case (yValue, aValue) => yValue.value * aValue.value
            } sum())).collect()

  private def getMaxReducedCostIndex(reducedCosts: Seq[Double]): Option[Int] =
    reducedCosts.indexOf(reducedCosts.max) match {
      case value@_ => 
        if (value <= 0) None
        else Some(value)
    }

  private def checkFeasibility(variables: VariableSet): Boolean = 
    if (Optimiser.sparkContext.parallelize(variables.basic).fold(1)((l, r) => 
      if (r < 0 || l < 0) -1 else 1) == -1)
        false
    else true

  private def calculateDirection(
    enteringIndex: Int,
    model: LinearProgrammingModel,
    bInverse: SparseMatrix): SparseVector =
      multiplyMatByVec(bInverse, model.constraintsForVar(enteringIndex))

  private def getLeavingVariableIndex(
    model: LinearProgrammingModel,
    variables: VariableSet, 
    direction: SparseVector): Option[Int] =
      Optimiser.sparkContext.parallelize(direction.toSeq).filter(elem =>
        elem.value > 0  
      ).map(elem =>
        (elem.index, variables.variables(elem.index) / elem.value)
      ).fold((0, 0D)) {
        case (k1@(index1, value1), k2@(index2, value2)) =>
          if (value1 < value2) 
            k1 
          else
            k2
      } match {
        case (index, value) if value > 0 => Some(index)
        case _ => None
      }

  private def getNewBasis(
    leavingIndex: Int,
    enteringIndex: Int,
    variables: VariableSet): VariableSet =
      new VariableSet(
        getNewBasicVariables(leavingIndex, enteringIndex, variables),
        getNewNonBasicVariables(leavingIndex, enteringIndex, variables),
        variables.variables
      )

  private def getNewBasicVariables(
    leavingIndex: Int, 
    enteringIndex: Int, 
    variables: VariableSet): Seq[Int] =
      variables.basic.take(leavingIndex) :+ enteringIndex

  private def getNewNonBasicVariables(
    leavingIndex: Int, 
    enteringIndex: Int, 
    variables: VariableSet): Seq[Int] =
      variables.nonbasic.take(enteringIndex) :+ leavingIndex

  private def calculateNewBInverse(model: LinearProgrammingModel, variables: VariableSet): Option[SparseMatrix] = 
    model.basicConstraints(variables).invert()

  private def calculateNewSolution(model: LinearProgrammingModel, bInverse: SparseMatrix): SparseVector = 
    multiplyMatByVec(bInverse, model.bVector)

  private def multiplyMatByVec(matrix: SparseMatrix, vector: SparseVector): SparseVector =
    new SparseVector(matrix.columns, Optimiser.sparkContext.parallelize(vector.toSeq).zip(
      Optimiser.sparkContext.parallelize(matrix.getRows())).map {
        case (vectorElem, matRow) => vectorElem.value match {
          case 0 => (vectorElem.index, 0D)
          case _ => (vectorElem.index, Optimiser.sparkContext.parallelize(matRow.toSeq).map(elem =>
            elem.value * vectorElem.value).sum())
        }
      } collectAsMap())
}

class LinearProgrammingModel(
  val constraintMatrix: SparseMatrix,
  val costVector: SparseVector,
  val bVector: SparseVector) {

  def basicConstraints(variables: VariableSet): SparseMatrix = 
      SparseMatrix.fromColumns(this.constraintMatrix.getColumns(variables.basic).toSeq)

  def basicCosts(variables: VariableSet): SparseVector =
    new SparseVector(variables.basic.size, 
      (0 until variables.basic.size).map(index =>
        (index, this.costVector(variables.basic(index)))).toMap)

  def constraintsForVar(variable: Int): SparseVector =
    this.constraintMatrix.getColumn(variable)

  def numVariables: Int = bVector.size
}

class VariableSet(
  val basic: Seq[Int],
  val nonbasic: Seq[Int],
  val variables: SparseVector)
