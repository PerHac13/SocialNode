const Search = require("../models/Search");
const logger = require("../utils/logger");

const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit!");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const { query } = req.query;

    const cachedKey = `search:${query}:${page}:${limit}`;
    const cachedResults = await req.redisClient.get(cachedKey);
    if (cachedResults) {
      logger.info("Search results fetched from cache");
      return res.json({
        ...JSON.parse(cachedResults),
        message: "Search results fetched from Caches (Not Modified)",
        success: true,
      });
    }

    const searchResults = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(startIndex)
      .limit(10);
    const totalResults = await Search.countDocuments({
      $text: { $search: query },
    });
    console.log("totalResults", totalResults);

    const results = {
      searchResults,
      currentPage: page,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
    };

    await req.redisClient.setex(cachedKey, 210, JSON.stringify(results));
    res.status(200).json({
      ...results,
      message: "Search results fetched successfully",
      success: true,
    });
  } catch (e) {
    logger.error("Error while searching post", error);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

module.exports = { searchPostController };
