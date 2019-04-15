$(document).ready(function () {
  console.log("hello world");
  $.ajax({
    method: "GET",
    url: "/articles"
  }).then(function (result) {
    displayResults(result);
  });

  function displayResults(articles) {
    articles.forEach(function (article) {
      var html = "";
      html += `<div class="row content-row p-3"><div class="row"><div class="col"><h3>${article.title}</h3>`;
      html += `<h6>${article.category}</h6></div></div>`;
      html += `<div class="row"><div class="col"><p>${article.summary}</p></div>`;
      html += `<div class="col"><img class='article-img img-fluid' src=${article.imageSrc}></div>`;
      html += `<div class="col"><button data-id=${article._id} id=note-btn-${article._id} class="btn btn-primary note-btn">Add Note</button><a href=${article.link}>`
      html += `<button id="read-btn-${article._id}" class="btn btn-warning link-btn">Read Article</button></a>`
      html += `<div id="note-${article._id}"></div></div></div>`
      html += `<hr size="10">`
      $("#content").append(html);
    });
  }

  // Whenever someone clicks a note button
  $(document).on("click", ".note-btn", function () {
    // Empty the notes from the note section
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");

    // Now make an ajax call for the Article
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    }).then(function (data) {
      console.log(data);
      $(`#note-btn-${data._id}`).attr("style", "display: none");
      $(`#read-btn-${data._id}`).attr("style", "display: none");
      $(`#note-${data._id}`).append("<textarea style='width: 80%; margin:4px;' class='form-control' rows='3' id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $(`#note-${data._id}`).append(`<button data-id="${data._id}" class="btn btn-success save-btn" id="save-btn-${data._id}">Save Note</button>`);
      $(`#note-${data._id}`).append(`<button data-id="${data._id}" class="btn btn-danger delete-btn" id="delete-btn-${data._id}">Delete Note</button>`);
      // If there's a note in the article
      if (data.comment) {
        // Place the title of the note in the title input
        $("#bodyinput").val(data.comment.body);
      }
    });
  });

    // Whenever someone clicks a note button
    $(document).on("click", ".delete-btn", function () {
      // Empty the notes from the note section
      // Save the id from the p tag
      var thisId = $(this).attr("data-id");
      
      // Now make an ajax call for the Article
      $.ajax({
        method: "DELETE",
        url: "/articles/" + thisId
      }).then(function (data) {
        console.log(data);
        $("#bodyinput");
        
        
      });
    });
  
  // When you click the savenote button
  $(document).on("click", ".save-btn", function () {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        // Value taken from title input
        // Value taken from note textarea
        body: $("#bodyinput").val()
      }
    })
      // With that done
      .then(function (data) {
        // Log the response
        console.log(data);
        // Empty the notes section
        $(`#note-${data._id}`).empty();
        $(`#note-btn-${data._id}`).attr("style", "display: inline-block");
        $(`#read-btn-${data._id}`).attr("style", "display: inline-block");
      });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
  });

})