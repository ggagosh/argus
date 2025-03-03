export const sampleData = [
  {
    op: "command",
    ns: "bookstore.books",
    command: {
      aggregate: "books",
      pipeline: [
        {
          $lookup: {
            from: "authors",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        {
          $unwind: "$author",
        },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: "$category",
        },
        {
          $match: {
            $and: [
              {
                title: {
                  $regex: "fantasy",
                  $options: "i",
                },
              },
              {
                price: {
                  $gte: 20,
                  $lte: 50,
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            price: 1,
            "author.name": 1,
            "category.name": 1,
          },
        },
        {
          $skip: 0,
        },
        {
          $limit: 25,
        },
      ],
      cursor: {},
    },
    keysExamined: 0.0,
    docsExamined: 150000.0,
    cursorExhausted: true,
    numYield: 10,
    nreturned: 25.0,
    queryHash: "C3B2D1E8",
    planCacheKey: "A7F92C4B",
    millis: 850.0,
    planSummary: "COLLSCAN",
    ts: { $date: "2025-03-03T10:00:00.000Z" },
    client: "192.168.1.100",
    appName: "bookstoreApp",
    allUsers: [{ user: "bookstoreAdmin", db: "bookstore" }],
    user: "bookstoreAdmin@bookstore",
  },
  {
    op: "command",
    ns: "bookstore.orders",
    command: {
      aggregate: "orders",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $lookup: {
            from: "orderItems",
            localField: "_id",
            foreignField: "orderId",
            as: "orderItems",
          },
        },
        {
          $unwind: "$orderItems",
        },
        {
          $lookup: {
            from: "books",
            localField: "orderItems.bookId",
            foreignField: "_id",
            as: "book",
          },
        },
        {
          $unwind: "$book",
        },
        {
          $lookup: {
            from: "addresses",
            localField: "shippingAddressId",
            foreignField: "_id",
            as: "shippingAddress",
          },
        },
        {
          $unwind: "$shippingAddress",
        },
        {
          $match: {
            orderDate: {
              $gte: { $date: "2024-01-01T00:00:00Z" },
              $lte: { $date: "2024-12-31T23:59:59Z" },
            },
            status: "PROCESSING",
          },
        },
        {
          $group: {
            _id: "$_id",
            orderValue: {
              $sum: { $multiply: ["$orderItems.quantity", "$book.price"] },
            },
            user: { $first: "$user" },
            shippingAddress: { $first: "$shippingAddress" },
            items: {
              $push: {
                bookTitle: "$book.title",
                quantity: "$orderItems.quantity",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            orderValue: 1,
            "user.firstName": 1,
            "user.lastName": 1,
            "shippingAddress.city": 1,
            items: 1,
          },
        },
        {
          $skip: 50,
        },
        {
          $limit: 10,
        },
      ],
      cursor: {},
    },
    keysExamined: 250000.0,
    docsExamined: 500000.0,
    cursorExhausted: true,
    numYield: 20,
    nreturned: 10.0,
    queryHash: "7A12FC9D",
    planCacheKey: "3E5B82A6",
    millis: 1200.0,
    planSummary: "COLLSCAN",
    ts: { $date: "2025-03-03T10:05:30.000Z" },
    client: "192.168.1.150",
    appName: "bookstoreAdminPanel",
    allUsers: [{ user: "adminUser", db: "bookstore" }],
    user: "adminUser@bookstore",
  },
  {
    op: "command",
    ns: "bookstore.categories",
    command: {
      aggregate: "categories",
      pipeline: [
        {
          $lookup: {
            from: "books",
            localField: "_id",
            foreignField: "categoryId",
            as: "books",
          },
        },
        {
          $match: {
            name: { $in: ["Science Fiction", "Fantasy", "Mystery"] },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            bookCount: { $size: "$books" },
          },
        },
        {
          $sort: { bookCount: -1 },
        },
      ],
      cursor: {},
    },
    keysExamined: 10000.0,
    docsExamined: 15000.0,
    cursorExhausted: true,
    numYield: 2,
    nreturned: 3.0,
    queryHash: "5F8E3A2B",
    planCacheKey: "9C2D7A1F",
    millis: 300.0,
    planSummary: "IXSCAN { name: 1 }",
    ts: { $date: "2025-03-03T10:10:00.000Z" },
    client: "192.168.1.200",
    appName: "bookstoreWebApp",
    allUsers: [{ user: "guest", db: "bookstore" }],
    user: "guest@bookstore",
  },
];
