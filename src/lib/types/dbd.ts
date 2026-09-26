export type DbdRole = 'survivor' | 'killer';

export type DbdPerk = {
	id: string;
	name: string;
	role: DbdRole;
	character: string;
	description: string;
	iconUrl: string;
};
