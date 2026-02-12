const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function canonicalizeEmail(email: string): string {
	const normalized = normalizeEmail(email);
	const [localPart, domainPart] = normalized.split("@");

	if (!localPart || !domainPart) {
		return normalized;
	}

	if (GMAIL_DOMAINS.has(domainPart)) {
		const withoutAlias = localPart.split("+")[0] ?? localPart;
		const withoutDots = withoutAlias.replace(/\./g, "");
		return `${withoutDots}@gmail.com`;
	}

	return normalized;
}

export function emailsMatch(a: string, b: string): boolean {
	return canonicalizeEmail(a) === canonicalizeEmail(b);
}

