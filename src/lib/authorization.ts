export async function getAuthorizationDateRange(user: User): Promise<DateRange> {
    // Returns { StartDate, endDate } for authorization checks.
    // Should be a month window.
    // Based on user's last invoice date, Stripe should be able to tell use what range we should use.
    // WE can then use this range to query for all the authz stuff.
}

export async function verifyLoadTestDuration(user: User, testDurationInMinutes: number): Promise<boolean> {
    // See above function.
    // Query for actual swarm duration within timeframe.
    // Check to see what works.

}