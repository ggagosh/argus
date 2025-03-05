import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function analyzeAndCutLargeInArrays(data, maxArrayLength = 10) {
  const MAX_IN_ARRAY_LENGTH = maxArrayLength;

  const ARRAY_OPERATORS = ["$in", "$nin", "$all"];

  if (!data || !Array.isArray(data)) {
    throw new Error("Input must be an array of MongoDB query log objects");
  }

  try {
    const dataCopy = structuredClone(data);

    let maxLength = 0;

    dataCopy.forEach((queryLog) => {
      if (
        queryLog?.command?.pipeline &&
        Array.isArray(queryLog.command.pipeline)
      ) {
        queryLog.command.pipeline.forEach((stage) => {
          if (stage && stage.$match) {
            maxLength = Math.max(
              maxLength,
              processObject(stage.$match, MAX_IN_ARRAY_LENGTH)
            );
          }
        });
      }

      if (queryLog?.query && typeof queryLog.query === "object") {
        maxLength = Math.max(
          maxLength,
          processObject(queryLog.query, MAX_IN_ARRAY_LENGTH)
        );
      }

      if (
        queryLog?.command?.filter &&
        typeof queryLog.command.filter === "object"
      ) {
        maxLength = Math.max(
          maxLength,
          processObject(queryLog.command.filter, MAX_IN_ARRAY_LENGTH)
        );
      }
    });

    function processObject(obj, maxLength) {
      let localMaxLength = 0;

      if (!obj || typeof obj !== "object") {
        return localMaxLength;
      }

      for (const key in obj) {
        const value = obj[key];

        if (value && typeof value === "object") {
          if (["$and", "$or", "$nor"].includes(key) && Array.isArray(value)) {
            value.forEach((condition) => {
              localMaxLength = Math.max(
                localMaxLength,
                processObject(condition, maxLength)
              );
            });
          } else if (ARRAY_OPERATORS.includes(key) && Array.isArray(value)) {
            localMaxLength = Math.max(localMaxLength, value.length);

            if (value.length > maxLength) {
              obj[key] = value.slice(0, maxLength);
            }
          } else {
            localMaxLength = Math.max(
              localMaxLength,
              processObject(value, maxLength)
            );
          }
        }
      }

      return localMaxLength;
    }

    return dataCopy;
  } catch (error) {
    console.error("Error processing query logs:", error);

    throw error;
  }
}