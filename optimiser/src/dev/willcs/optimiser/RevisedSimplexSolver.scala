import org.apache.spark.SparkContext
import dev.willcs.optimiser.SparseMatrix
import dev.willcs.optimiser.SparseVector

class RevisedSimplexSolver(sparkContext: SparkContext) {
  private val spark = sparkContext

  def solve(model: LinearProgrammingModel): Option[Array[Double]] = None

  private def initialiseVariables(model: LinearProgrammingModel): Array[Double] = 
    new Array[Double](model.numVariables)
}

class LinearProgrammingModel(
    constraints: SparseMatrix,
    costs: SparseVector,
    b: SparseVector) {
  val constraintMatrix: SparseMatrix = constraints
  val costVector: SparseVector = costs
  val bVector: SparseVector = b

  def numVariables: Int = this.bVector.size
}