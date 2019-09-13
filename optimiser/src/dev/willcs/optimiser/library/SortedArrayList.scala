package dev.willcs.optimiser.library
import scala.reflect.ClassTag
import scala.collection.immutable.List

/** Immutable Array List implementation for ordered types. 
 *  Elements of the list are automatically sorted when inserted, using a binary
 *  sort.
 * 
 *  @author Will Stibbards
 */
class SortedArrayList[A <: Ordered[A]](elems: Array[A])(implicit tag: ClassTag[A]) extends Traversable[A] {
  /** The array that actually stores the elements of the list. */
  private val array: Array[A] = elems

  /** Secondary constructor that takes a traversable rather than an array. */ 
  def this(elems: Traversable[A])(implicit tag: ClassTag[A]) = this(elems.toArray[A](tag))

  /** Secondary constructor that takes no arguments and constructs
   *  an empty list.
   */
  def this()(implicit tag: ClassTag[A]) = this(new Array[A](0))

  /** From `Traversable`, iterate over every element in this list. */
  def foreach[U](f: A => U): Unit = this.array.foreach(f)

  /** Insert a new element into the list, automatically sorting it. */
  def insert(element: A): SortedArrayList[A] =
    if (this.length == 0)
      new SortedArrayList(this.array :+ element)
    else (
      (index: Int) => new SortedArrayList(
        (this.array.slice(0, index) :+ element) ++ this.array.slice(index, this.array.length)
      ))(this.search(element))

  /** Insert a collection of elements into the list, ensuring that the list
   *  is properly sorted as they are inserted.
   */
  def insertAll(elems: Traversable[A]) : SortedArrayList[A] = (this /: elems)(
    (list: SortedArrayList[A], element: A) => list.insert(element)
  )

  /** Find the index of the given element in this list, if it exists, otherwise
   *  return the index that this element would be at were it in the array.
   */
  def search(element: A): Int = this.pivot(element, 0, this.getPivotOffset(this.length))

  /** Find the closest element in this list to the given element. If the given
   *  element is already in this list, this will return that element.
   */
  def findClosest(element: A): A = this(this.search(element))

  /** If the given element is in this list, remove it, otherwise do nothing. */
  def remove(element: A): SortedArrayList[A] = 
    new SortedArrayList[A](
      this.array.filter(
        (element: A) => element.compare(element) != 0
      )
  )

  /** Return the element at the given index in this list. */
  def apply(index: Int): A = this.array(index)

  /** Return the length of this list. */
  def length = this.array.length

  override def toString(): String = this.array.toString()

  /** Recursive implementation of a binary sort/search algorithm. Compares
   *  the given element with the element at the pivot position, offset by the
   *  given pivot offset, and returns that element's index if the given element
   *  should go after the found element.
   */
  private def pivot(element: A, pivotPosition: Int, pivotOffset: Int): Int =
    if (pivotOffset == 0)
      this.getCutWhenPivotZero(element, pivotPosition)
    else
      ((newPivot: Int) => element.compare(this.array(newPivot)) match {
        case 0 => newPivot
        case x => this.pivot(
          element,
          newPivot,
          x * this.getPivotOffset(pivotOffset))
      })(pivotPosition + pivotOffset)

  /** Idk why but I was getting weird behaviour when inserting into a short
   *  list. This fixed it.
   */
  private def getCutWhenPivotZero(element: A, pivotPosition: Int): Int =
    pivotPosition + (
      if (element.compare(this.array(pivotPosition)) == -1)
        if (element.compare(this.array(pivotPosition - 1)) == -1) -1 else 0 
      else 1)

  /** Calculate the pivot offset that should be used in the next iteration
   *  of the binary search, based on the pivot offset from the current
   *  iteration.
   */
  private def getPivotOffset(from: Int): Int =
    ((oldOffset: Int) =>
      if (oldOffset % 2 == 0) 
        oldOffset / 2 
      else 
        (oldOffset - 1) / 2
    )(Math.abs(from))
}