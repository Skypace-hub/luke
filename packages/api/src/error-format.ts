const technicalErrorPatterns = [
	/failed query/i,
	/insert into/i,
	/update\s+.+\s+set/i,
	/delete from/i,
	/select\s+.+\s+from/i,
	/params:/i,
	/sql/i,
	/drizzle/i,
	/constraint/i,
	/violates/i,
	/duplicate key/i,
	/invalid input syntax/i,
] as const;

export function isTechnicalErrorMessage(message: string) {
	return technicalErrorPatterns.some((pattern) => pattern.test(message));
}
