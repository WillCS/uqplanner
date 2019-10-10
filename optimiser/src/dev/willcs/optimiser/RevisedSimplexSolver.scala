package dev.willcs.optimiser

import org.apache.spark.SparkContext

import scala.collection.mutable.Map
import scala.util.{Try, Success, Failure}

import dev.willcs.optimiser.library.Debug

object RevisedSimplexSolver {
  def solve(model: LinearProgrammingModel): Try[VariableSet] = 
    initialiseVariables(model).flatMap(variables =>
      calculateNewBInverse(model, variables).flatMap(newBInverse =>
        doSimplexIteration(
          1,
          model,
          variables,
          newBInverse
        )
      )
    )

  private def initialiseVariables(model: LinearProgrammingModel): Try[VariableSet] =
    Optimiser.sparkContext.parallelize(
      (0 until model.constraintMatrix.columns)
    ).filter(columnIndex =>
      model.constraintMatrix.getColumn(columnIndex).get.nonZeroCount == 1).collect() match {
        case basicIndices if basicIndices.size == 0 => 
          Failure(new Exception(s"Basis has no indices: ${basicIndices}"))
        case basicIndices if basicIndices.size < model.bVector.length =>
          chooseRemainingBasicVariables(
            model, 
            (0 until model.constraintMatrix.columns).filter(columnIndex =>
              !basicIndices.contains(columnIndex)
            ),
            model.bVector.length - basicIndices.length,
            2
          ) match {
            case Some(additionalColumns) =>
              Success(
                new VariableSet(
                  (basicIndices ++ additionalColumns).sortBy(index =>
                    model.constraintMatrix.getColumn(index).get.firstIndex.get
                  ),
                  (model.decisionVariables ++ model.slackVariables).filter(variable =>
                    !(basicIndices ++ additionalColumns).contains(variable)
                  ),
                  model.bVector
                )
              )
            case None => Failure(new Exception(s"Something bad happened"))
          }
        case basicIndices if basicIndices.size == model.bVector.length =>
          Success(
            new VariableSet(
              basicIndices.toSeq,
              Optimiser.sparkContext.parallelize(0 until model.bVector.size).filter(index =>
                !basicIndices.contains(index)).collect().toSeq,
              model.bVector
            )
          )
        case basicIndices => Failure(new Exception(s"Basis has no indices: ${basicIndices}"))
      }

  private def chooseRemainingBasicVariables(
    model: LinearProgrammingModel,
    remainingCols: Seq[Int],
    left: Int,
    withNonZeroes: Int): Option[Seq[Int]] =
      if (left == 0)
        Some(Seq[Int]())
      else if (withNonZeroes > model.bVector.length || remainingCols.isEmpty)
        None
      else
        Optimiser.sparkContext.parallelize(remainingCols).filter(columnIndex =>
          model.constraintMatrix.getColumn(columnIndex).get.nonZeroCount == withNonZeroes).collect() match {
            case eligibleColumnIndices if eligibleColumnIndices.length == 0 => 
              chooseRemainingBasicVariables(model, remainingCols, left, withNonZeroes + 1)
            case eligibleColumnIndices => 
              ((newColumn: Int) => 
                chooseRemainingBasicVariables(
                  model,
                  remainingCols.filter(i => i != newColumn),
                  left - 1,
                  withNonZeroes).map(vars =>
                    vars :+ newColumn)
              )(eligibleColumnIndices.max)
          }
      
      

  private def doSimplexIteration(
    i: Int,
    model: LinearProgrammingModel,
    variables: VariableSet,
    bInverse: SparseMatrix): Try[VariableSet] =
        Debug.printThen(
          Array(
            s"Iteration ${i}",
            s"Basic Variables: ${variables.basic}",
            s"Nonbasic Variables: ${variables.nonbasic}",
            s"Current Solution: ${variables.variables}",
            s"B^-1: (${bInverse.rows}x${bInverse.columns})\n${bInverse}"
          ).mkString("\n"),
          getMaxReducedCostIndex(
            calculateReducedCosts(
              model,
              variables,
              Debug.doThenPrint(
                calculateDualVariables(model, variables, bInverse),
                ((dualVector: SparseVector) =>
                  s"Dual Vector: ${dualVector.toString()}"
                )
              )
            )
          )) match {
            case None => Success(variables)
            case Some(enteringIndex) =>
              getLeavingVariableIndex(
                model,
                variables,
                calculateDirection(enteringIndex, model, variables, bInverse)
              ).flatMap(leavingIndex =>
                completeSimplexIteration(
                  i,
                  model,
                  getNewBasis(leavingIndex, enteringIndex, variables)
                )
              )
          }

  private def completeSimplexIteration(
    i: Int,
    model: LinearProgrammingModel,
    newBasis: VariableSet): Try[VariableSet] =
      calculateNewBInverse(model, newBasis).flatMap(newBInverse =>
        doSimplexIteration(
          i + 1,
          model,
          new VariableSet(
            newBasis.basic,
            newBasis.nonbasic,
            calculateNewSolution(model, newBInverse)
          ),
          newBInverse
        )
      )

  private def calculateDualVariables(
    model: LinearProgrammingModel,
    variables: VariableSet,
    bInverse: SparseMatrix): SparseVector =
      multiplyMatByVec(bInverse.transpose, model.basicCosts(variables))
  
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
    if (reducedCosts.max < 0)
       None
    else 
      Some(reducedCosts.indexOf(reducedCosts.max))

  private def checkFeasibility(variables: VariableSet): Boolean = 
    if (Optimiser.sparkContext.parallelize(variables.basic).fold(1)((l, r) => 
      if (r < 0 || l < 0) -1 else 1) == -1)
        false
    else true

  private def calculateDirection(
    enteringIndex: Int,
    model: LinearProgrammingModel,
    variables: VariableSet,
    bInverse: SparseMatrix): SparseVector =
      multiplyMatByVec(bInverse, model.constraintsForVar(variables.nonbasic(enteringIndex)))

  private def getLeavingVariableIndex(
    model: LinearProgrammingModel,
    variables: VariableSet, 
    direction: SparseVector): Try[Int] = 
      Optimiser.sparkContext.parallelize(0 until variables.basic.length).filter(basicIndex =>
        direction(basicIndex).get > 0
      ).map(basicIndex =>
        (basicIndex, variables(basicIndex) / direction(basicIndex).get)
      ).fold((-1, Double.MaxValue)) {
        case (p1@(k1, v1), p2@(k2, v2)) => 
          if (v1 < v2)
            p1
          else
            p2
      } match {
        case (-1, _) => Failure(new Exception("Infeasible Model"))
        case (index, value) => 
          Success(index)
      }

  private def getNewBasis(
    leavingIndex: Int,
    enteringIndex: Int,
    variables: VariableSet): VariableSet =
      new VariableSet(
        getNewBasicVariables(leavingIndex, enteringIndex, variables).sorted,
        getNewNonBasicVariables(leavingIndex, enteringIndex, variables).sorted,
        variables.variables
      )

  private def getNewBasicVariables(
    leavingIndex: Int, 
    enteringIndex: Int, 
    variables: VariableSet): Seq[Int] =
      variables.basic.filter(variable =>
        variable != variables.basic(leavingIndex)
      ) :+ variables.nonbasic(enteringIndex)

  private def getNewNonBasicVariables(
    leavingIndex: Int, 
    enteringIndex: Int, 
    variables: VariableSet): Seq[Int] =
      variables.nonbasic.filter(variable =>
        variable != variables.nonbasic(enteringIndex)
      ) :+ variables.basic(leavingIndex)

  private def calculateNewBInverse(model: LinearProgrammingModel, variables: VariableSet): Try[SparseMatrix] = {
    model.basicConstraints(variables).invert()
  }

  private def calculateNewSolution(model: LinearProgrammingModel, bInverse: SparseMatrix): SparseVector =
    multiplyMatByVec(bInverse, model.bVector)

  private def multiplyMatByVec(matrix: SparseMatrix, vector: SparseVector): SparseVector =
    new SparseVector(vector.size, Optimiser.sparkContext.parallelize(0 until matrix.rows).map(rowIndex =>
      (rowIndex, 
        if (matrix.getRow(rowIndex).get.nonZeroCount == 0) 
          0D
        else
          matrix.getRow(rowIndex).get.dot(vector).get)
    ).collect().toMap)
}

class LinearProgrammingModel(
  val constraintMatrix: SparseMatrix,
  val costVector: SparseVector,
  val bVector: SparseVector,
  val decisionVariables: Seq[Int],
  val slackVariables: Seq[Int]) extends Serializable {

  def basicConstraints(variables: VariableSet): SparseMatrix =
    SparseMatrix.fromColumns(this.constraintMatrix.getColumns(variables.basic).get.toSeq)

  def basicCosts(variables: VariableSet): SparseVector =
    new SparseVector(variables.basic.size, 
      (0 until variables.basic.size).map(index =>
        (index, this.costVector(variables.basic(index)).get)
        ).toMap)

  def constraintsForVar(variable: Int): SparseVector =
    this.constraintMatrix.getColumn(variable).get

  def numVariables: Int = bVector.size
}

class VariableSet(
  val basic: Seq[Int],
  val nonbasic: Seq[Int],
  val variables: SparseVector) extends Serializable {

    def apply(index: Int): Double =
      this.variables(index).get
  }
