package dev.willcs.optimiser.library

object MathUtils {
  def valueInRange(value: Double, lower: Double, upper: Double): Boolean =
    value >= lower && value < upper
}
