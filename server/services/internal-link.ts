const findOne = async () => {
	return strapi.entityService.findOne();
};

const find = async () => {
	return strapi.entityService.findMany();
};

const findByTargetContentType = async (uid, id) => {
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

const findBySourceContentType = async (uid, id) => {
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

const updateManyByTargetContentType = async (uid, id, url) => {
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

const create = async (data) => {
	return strapi.entityService.create('plugin::internal-links.internal-link', {
		data
	});
};

const update = async (id, data) => {
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
	find,
	findOne,
	create,
	update,
	remove,
	findByTargetContentType,
	findBySourceContentType,
	updateManyByTargetContentType,
	deleteManyBySourceContentType
};
