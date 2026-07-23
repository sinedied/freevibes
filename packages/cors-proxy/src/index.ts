type Env = {
	ALLOWED_ORIGINS: string;
};

function isAllowedOrigin(origin: string | undefined, allowedOrigins: string): boolean {
	if (!origin) return false;
	const origins = allowedOrigins.split(',').map((o) => o.trim());
	return origins.some((allowed) => origin === allowed || origin.startsWith('http://localhost:'));
}

function corsHeaders(origin: string | undefined, allowedOrigins: string): HeadersInit {
	const headers: HeadersInit = {
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Max-Age': '86400',
	};
	if (origin && isAllowedOrigin(origin, allowedOrigins)) {
		headers['Access-Control-Allow-Origin'] = origin;
	}

	return headers;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get('Origin');
		const allowedOrigins = env.ALLOWED_ORIGINS || '';

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: corsHeaders(origin, allowedOrigins),
			});
		}

		if (request.method !== 'GET') {
			return new Response('Method not allowed', { status: 405 });
		}

		const url = new URL(request.url);
		const targetUrl = url.searchParams.get('url');

		if (!targetUrl) {
			return new Response('Missing "url" query parameter', {
				status: 400,
				headers: corsHeaders(origin, allowedOrigins),
			});
		}

		try {
			const _ = new URL(targetUrl);
		} catch {
			return new Response('Invalid URL', {
				status: 400,
				headers: corsHeaders(origin, allowedOrigins),
			});
		}

		try {
			const response = await fetch(targetUrl, {
				headers: {
					'User-Agent': 'FreeVibes RSS Reader/1.0',
					Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
				},
			});

			const responseHeaders = new Headers(corsHeaders(origin, allowedOrigins));
			responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'text/plain');

			return new Response(response.body, {
				status: response.status,
				headers: responseHeaders,
			});
		} catch (error: unknown) {
			return new Response(`Failed to fetch: ${String(error)}`, {
				status: 502,
				headers: corsHeaders(origin, allowedOrigins),
			});
		}
	},
};
