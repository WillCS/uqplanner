export interface UniClass {
  day: number;
  startTime: { hours: number; minutes: number };
  endTime: { hours: number; minutes: number };
  type: string;
  streamIndex: number;
  courseName: string;
  streamId: string;
}

export function optimizeTimetable(
  allCourses: any[],
  minDays: number,
  maxDays: number,
  allowLectureClash: boolean = false
): UniClass[] {
  const allDays = [0, 1, 2, 3, 4];

  // STEP 1: Flatten class type streams
  const typeStreams: UniClass[][] = [];
  for (const course of allCourses) {
    for (const classType of course.classes) {
      typeStreams.push(
        classType.streams.map((stream, streamIndex) => ({
          ...stream.classes[0],
          type: classType.name,
          streamIndex,
          courseName: course.name,
          streamId: stream.streamId,
        }))
      );
    }
  }

  // STEP 2: Try all day combinations
  for (let d = minDays; d <= maxDays; d++) {
    const dayCombos = getCombinations(allDays, d);
    for (const dayCombo of dayCombos) {
      const schedule = tryAllFits(typeStreams, new Set(dayCombo), [], allowLectureClash);
      if (schedule) return schedule;
    }
  }
  return [];
}

// Helper: Get all combinations of array elements of length n
function getCombinations(arr: number[], n: number): number[][] {
  if (n === 0) return [[]];
  if (arr.length < n) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, n - 1).map((comb) => [first, ...comb]);
  const withoutFirst = getCombinations(rest, n);
  return [...withFirst, ...withoutFirst];
}

// Recursive backtracking
function tryAllFits(
  typeStreams: UniClass[][],
  allowedDays: Set<number>,
  chosen: UniClass[] = [],
  allowLectureClash: boolean = false
): UniClass[] | null {
  if (typeStreams.length === 0) return chosen;
  const [currentType, ...rest] = typeStreams;
  for (const streamOption of currentType) {
    if (!allowedDays.has(streamOption.day)) continue;
    if (
      chosen.some((c) =>
        overlaps(streamOption, c) &&
        !(allowLectureClash && (streamOption.type.toLowerCase().includes("lec") || c.type.toLowerCase().includes("lec")))
      )
    ) continue;
    const result = tryAllFits(rest, allowedDays, [...chosen, streamOption], allowLectureClash);
    if (result) return result;
  }
  return null;
}

// Overlap check
function overlaps(a: UniClass, b: UniClass): boolean {
  if (a.day !== b.day) return false;
  const aStart = a.startTime.hours * 60 + a.startTime.minutes;
  const aEnd = a.endTime.hours * 60 + a.endTime.minutes;
  const bStart = b.startTime.hours * 60 + b.startTime.minutes;
  const bEnd = b.endTime.hours * 60 + b.endTime.minutes;
  return aStart < bEnd && bStart < aEnd;
}