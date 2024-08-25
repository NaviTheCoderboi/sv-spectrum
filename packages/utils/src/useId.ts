const idsUpdaterMap: Map<string, (v: string) => void> = new Map();

/**
 * Merges two ids.
 * @param idA - The first id.
 * @param idB - The second id.
 *
 * @returns The merged id.
 */
export const mergeIds = (idA: string, idB: string): string => {
	if (idA === idB) {
		return idA;
	}

	const setIdA = idsUpdaterMap.get(idA);
	if (setIdA) {
		setIdA(idB);
		return idB;
	}

	const setIdB = idsUpdaterMap.get(idB);
	if (setIdB) {
		setIdB(idA);
		return idA;
	}

	return idB;
};
