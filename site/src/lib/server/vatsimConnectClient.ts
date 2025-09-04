import { env } from '$env/dynamic/private';
import { USE_MOCK_DATA } from '$lib/mocks';

export type VatsimUserDataResponse = {
	data: VatsimUserData;
};

export type VatsimUserData = {
	cid: string;
	personal: {
		name_first: string;
		name_last: string;
		name_full: string;
		email: string;
	};
	vatsim: {
		rating: {
			id: number;
			short: string;
			long: string;
		};
		pilotrating: {
			id: number;
			short: string;
			long: string;
		};
		region: {
			id: string;
			name: string;
		};
		division: {
			id: string;
			name: string;
		};
	};
	oauth: {
		token_valid: string;
	};
};

export async function fetchUserData(accessToken: string): Promise<VatsimUserData | null> {
	try {
		const response = await fetch(`${env.CONNECT_BASE_URL!}/api/user`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`
			}
		});

		if (!response.ok) {
			console.error('Failed to fetch user details', { status: response.status });
			return null;
		}

		return (await response.json<VatsimUserDataResponse>()).data;
	} catch (error) {
		console.error('Error during user details fetch', error);
		return null;
	}
}
