package dev.willcs.optimiser.library

object MathUtils {
    def valueInRange(value: Double, upper: Double, lower: Double): Boolean =
        value >= upper && value < lower
}