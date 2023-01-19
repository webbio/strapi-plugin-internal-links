const findByTargetContentType = async (uid: string, id: string) => {
	return strapi.entityService.findMany('plugin::internal-links.internal-link', {
		filters: {
			$and: [
				{
					targetContentTypeUid: { $eq: uid }
				},
				{
					targetContentTypeId: { $eq: id }
				}
			]
		}
	});
};

const findBySourceContentType = async (uid: string, id: string) => {
	return strapi.entityService.findMany('plugin::internal-links.internal-link', {
		filters: {
			$and: [
				{
					sourceContentTypeUid: { $eq: uid }
				},
				{
					sourceContentTypeId: { $eq: id }
				}
			]
		}
	});
};

const updateManyByTargetContentType = async (uid: string, id: string, url: string) => {
	return strapi.db.query('plugin::internal-links.internal-link').updateMany({
		where: {
			$and: [
				{
					targetContentTypeUid: { $eq: uid }
				},
				{
					targetContentTypeId: { $eq: id }
				}
			]
		},
		data: {
			url
		}
	});
};
const create = async (data: any) => {
	return strapi.entityService.create('plugin::internal-links.internal-link', {
		data
	});
};
const update = async (id: string, data: any) => {
	const targetContentType = await strapi.entityService.findOne(data.targetContentTypeUid, data.targetContentTypeId);

	if (!targetContentType) {
		throw new Error('Not found.');
	}

	const internalLink = {
		...data
	};

	return strapi.entityService.update('plugin::internal-links.internal-link', id, {
		data: internalLink
	});
};

const remove = async (id) => {
	return strapi.entityService.delete('plugin::internal-links.internal-link', id);
};

const deleteManyBySourceContentType = async (uid, ids) => {
	return strapi.db.query('plugin::internal-links.internal-link').deleteMany({
		where: {
			$and: [
				{
					sourceContentTypeUid: {
						$eq: uid
					}
				},
				{
					sourceContentTypeId: {
						$in: ids
					}
				}
			]
		}
	});
};

export default {
	findByTargetContentType,
	findBySourceContentType,
	updateManyByTargetContentType,
	create,
	update,
	remove,
	deleteManyBySourceContentType
};
