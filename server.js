//require dependencies
var mongoose = require("mongoose");
var express = require("express");
var cheerio = require("cheerio");
var axios = require("axios");
var logger = require("morgan");
// Set Handlebars.
var exphbs = require("express-handlebars");

// Requiring the `User` model for accessing the `users` collection
var db = require("./models");

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mydb";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

//define application
var app = express();

//define the port
var PORT = 3500 || process.env.PORT;

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));



app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");



//scrape
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.npr.org/sections/news/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("article.item.has-image").each(function (i, element) {
      // Save an empty result object
      //var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      var title = $(element).find("div.item-info").find("h2.title").find("a").text();
      var summary = $(element).find("div.item-info").find("p.teaser").find("a").text();
      var link = $(element).find("div.item-info").find("h2.title").find("a").attr("href");
      var imageSrc = $(element).find("div.item-image").find("div.imagewrap").find("a").find("img").attr("src");
      var category = $(element).find("div.item-info").find("div.slug-wrap").find("h3").text();

      var newArticle = {
        title: title,
        summary: summary,
        link: link,
        imageSrc: imageSrc,
        category: category
      }

      // Create a new Article using the `result` object built from scraping
      db.Article.create(newArticle)
        .then(function (result) {
          // View the added result in the console
          console.log(result);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
    });
    // Send a message to the client
    res.send("Scrape Complete");
  });
});
app.get("/", function (req, res) {
  db.Article.find({}).then(function (result) {
    // If we were able to successfully find Articles, send them back to the client
    res.render("index", result);
  })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get("/favorites", function (req, res) {
  db.Article.find({}).then(function (result) {

    res.render("index", result);
  })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


app.get("/articles", function (req, res) {
  db.Article.find({}).then(function (result) {
    // If we were able to successfully find Articles, send them back to the client
    res.json(result);
  })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
})

// Route for grabbing a specific Article by id, populate it with it's comment
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })

    .populate("comment")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.post("/articles/:id", function (req, res) {
  // Create a new comment and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(function (result) {
      // If a comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new comment
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { comment: result._id }, { new: true });
    })
    .then(function (result) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(result);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.put("/articles/favorites/:id", function (req, res) {
  // Create a new comment and pass the req.body to the entry
  db.Article.findOne({ _id: req.params.id }).then(function (result) {
    if (result.isFavorite) {
      db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { isFavorite: false } })
        .then(function (result) {
          // If we were able to successfully update an Article, send it back to the client
          res.json(result);
        })
        .catch(function (err) {
          res.json(err)
        });
    } else {
      db.Article.findOneAndUpdate({ _id: req.params.id }, { $set: { isFavorite: true } })
        .then(function (result) {
          // If we were able to successfully update an Article, send it back to the client
          res.json(result);
        })
        .catch(function (err) {
          res.json(err)
        });
    }
  })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });


})





app.delete("/articles/:id", function (req, res) {
  // Create a new comment and pass the req.body to the entry
  db.Article.update({ "_id": req.params.id }, { $unset: { comment: 1 } })
    .then(function (result) {
      // If we were able to successfully delete a comment, send it back to the client
      res.json(req.params.id);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//set server up
app.listen(PORT, function () {
  console.log("App is listening on port", PORT)
})
