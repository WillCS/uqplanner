package dev.willcs.optimiser.library

object Debug {
  def printThen[U](message: String, function: => U): U = {
    println(message)
    function
  }

  def doThenPrint[U](function: => U, getMessage: U => String): U = {
    val result = function
    println(getMessage(result))
    result
  }
}