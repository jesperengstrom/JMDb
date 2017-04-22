"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function () {
    //dom ready - load all movies
    window.addEventListener("DOMContentLoaded", function () {
        return api.prepareURL();
    });

    //nav "show all movies". Gets all from API once again
    document.getElementById("show-all-movies").addEventListener("click", function () {
        return api.prepareURL();
    });

    //evt quick search both click & enter key.
    document.getElementById("quick-search-btn").addEventListener("click", function () {
        return search.quickSearch();
    });
    document.getElementById("quick-search").addEventListener("submit", function () {
        return search.quickSearch();
    });

    //event listener for add new movie submit button
    document.getElementById("add-submit").addEventListener("click", function () {
        var title = document.getElementById("add-title").value;
        title.length === 0 ? alert("Please provide a title for your movie!") : makeNew.makeMovie();
    });

    //evt add cancel
    document.getElementById("add-cancel").addEventListener("click", function () {
        return makeNew.resetAddForm();
    });

    //evt search cancel
    document.getElementById("search-cancel").addEventListener("click", function () {
        return makeNew.resetSearchForm();
    });

    //evt advanced search submit button
    document.getElementById("search-submit").addEventListener("click", function () {
        return search.makeSearchObject();
    });

    //evt edit genre modal submit
    document.getElementById("edit-genre-submit").addEventListener("click", function () {
        var addGenre = Array.from(document.querySelectorAll("#edit-genre-form input:checked")).map(function (val) {
            return val.value;
        });
        var id = event.target.getAttribute("data-id");
        store.editGenre(addGenre, id);
    });

    //evt delete movie
    document.getElementById("delete-movie-btn").addEventListener("click", function () {
        var id = document.getElementById("edit-genre-submit").getAttribute("data-id");
        if (confirm("Are you sure you want to delete this movie?")) {
            api.deleteMovie(id);
        }
    });

    document.addEventListener("scroll", function () {
        if ($(window).scrollTop() > 30) {
            document.getElementsByTagName("nav")[0].classList.add("box-shadow");
        }
        if ($(window).scrollTop() < 30) {
            document.getElementsByTagName("nav")[0].classList.remove("box-shadow");
        }
    });
})();

/**
 * Module #1 - make new movies. The add form input is collected and made into an object using a constructor and some helper methods which are set to 
 * the constructor prototype. To have the constructor inside a closure is also handy because local var idCounter can be stored outside and provide 
 * a unique id to every object passing through the constructor (would otherwise have been reset). The movies are then passed on to the storage.
 */
var makeNew = function () {
    //var idCounter = -1;

    //Movie constructor
    function Movie(title, rating, year, genre, cover, director, starring) {
        this.title = title;
        this.rating = [rating];
        this.year = year;
        this.director = director;
        this.starring = starring;
        this.genre = genre;
        this.cover = cover;
        //this.id = idCounter++;
        this.averageRating = avRating(this.rating);
    }

    //old prototype method that calcs average rating
    // Movie.prototype.getAverageRating = function() {
    //     let rating = parseFloat((this.rating.reduce((prev, cur) => prev + cur) / this.rating.length).toFixed(1));
    //     return rating;
    // };

    Movie.prototype.makeArray = function (string) {
        return string.split(", ");
    };

    /**
     * Runs when "submit-movie" button is clicked.
     */
    function makeMovie() {
        var movieTitle = document.getElementById("add-title").value;
        var movieRating = parseInt(document.getElementById("add-rating").value);
        var movieYear = parseInt(document.getElementById("add-year").value);
        var movieGenre = Array.from(document.querySelectorAll(".add-genre:checked")).map(function (val) {
            return val.value;
        });
        var movieCover = document.getElementById("add-cover").value;
        var movieDirector = "" ? undefined : document.getElementById("add-director").value;
        var movieStarring = document.getElementById("add-starring").value;

        var newMovie = new Movie(movieTitle, movieRating, movieYear, movieGenre, movieCover, movieDirector, movieStarring);
        newMovie.starring = newMovie.makeArray(newMovie.starring);

        //post the new movie
        api.postMovie(newMovie);
        resetAddForm();
    }

    function avRating(arr) {
        var rating = parseFloat((arr.reduce(function (prev, cur) {
            return prev + cur;
        }) / arr.length).toFixed(1));
        return rating;
    }

    function resetAddForm() {
        var inputs = document.querySelectorAll("#add-movie-form input");
        inputs.forEach(function (el) {
            if (el.type == "text" || el.type == "url") el.value = "";
            if (el.type == "checkbox") el.checked = false;
            if (el.type == "number") el.value = 2017;
        });
        document.querySelectorAll("#add-rating option").forEach(function (el) {
            if (el.value == "5") el.selected = "selected";
        });
    }

    function resetSearchForm() {
        var inputs = document.querySelectorAll("#search-movie-form input");
        inputs.forEach(function (el) {
            if (el.type == "text" || el.type == "url") el.value = "";
            if (el.type == "checkbox") el.checked = false;
            yearSlider.noUiSlider.set(1920, 2020);
            ratingSlider.noUiSlider.set(1, 10);
        });
    }

    return {
        makeMovie: makeMovie,
        Movie: Movie,
        resetAddForm: resetAddForm,
        resetSearchForm: resetSearchForm,
        avRating: avRating
    };
}();

/**
 * module #2 - Database. My existing movies are tucked away in storage here with no risk of manipulation once created.
 * The module is providing public endpoints which are basically CRUD-methods (minus delete) to meet my specific needs.
 */
var store = function () {
    //This is the array where all the movies are stored.
    var movieDatabase = [];
    //This is the array of our current selection - not needed
    //var currentSelection = [];

    var hasVoted = {};

    return {
        getAllMovies: function getAllMovies() {
            return movieDatabase;
        },

        refreshMovies: function refreshMovies(movies) {
            return print.printMovies(movies);
        },

        //riginal function pushing movies to array REMOVE?
        // addMovie: function(obj) {
        //     movieDatabase.push(obj);
        // },

        /**
         * gets an array from the api, stores and sends to print
         */
        storeMovies: function storeMovies(movies) {
            movieDatabase = movies;
            store.refreshMovies(movieDatabase);
        },

        /**
         * Rate movies event listeners + what happens when we rate
         */
        addRating: function addRating(movies) {
            document.querySelectorAll(".rate-btn").forEach(function (el) {
                el.addEventListener("click", function () {
                    //get the id of the movie that was clicked
                    var targetId = parseInt(el.getAttribute("data-id"));
                    // + new value
                    var rating = parseInt(document.getElementById("selectId-" + targetId).value);

                    //now we need to push the new rating to the arr, update the average and patch
                    var targetMovie = movies.filter(function (el) {
                        if (el.id === targetId) return el;
                    });

                    var ratingsArr = targetMovie[0].rating;
                    ratingsArr.push(rating);
                    var newAverage = makeNew.avRating(ratingsArr);

                    var ratingsPatch = {
                        rating: ratingsArr,
                        averageRating: newAverage
                    };

                    api.patchMovie(targetId, ratingsPatch);
                    hasVoted[targetId] = true;
                });
            });
        },

        editGenre: function editGenre(newGenres, id) {
            var genresPatch = {
                genre: newGenres
            };
            api.patchMovie(id, genresPatch);
        },

        //all things currentSelection can be removed I think...

        //stores and gets current selection to prevent all movies from showing up when we add a grade or genre.
        // storeCurrentSelection: function(arr) {
        //     this.currentSelection = arr;
        // },
        // getCurrentSelection: function() {
        //     return this.currentSelection;
        // },
        haveYouVoted: function haveYouVoted(id) {
            if (hasVoted.hasOwnProperty(id)) return true;
            return false;
        }
    };
}();

/**
 * Module #3 - Search. This one ectracts the data from the search form making it a search object. It then sends the object to the performSearch
 * function that compares it to the movie databases' movie prop/values using some helper methods. It returns a search result array that is 
 * stored and sent to the print module
 */
var search = function () {

    function quickSearch() {
        var input = document.getElementById("quick-search-text");
        var string = "?q=" + qSpace(input.value);
        api.prepareURL(string);
        input.value = "";
    }

    //Kinda unnecessary to have a new constructor for the searches and make Movie it's prototype. I did this to 
    //give acess to Movie's makeArray function. Could have just made it a public function but this more fun :)
    function Search() {}
    Search.prototype = new makeNew.Movie();

    /**
     * Advanced search form input is handled here.
     */
    function makeSearchObject() {
        var searchObj = new Search();

        //rest of this func checks if the input fields have something in them. if not, that search property will be left out.
        //year and ratings span do always have a value (and is set to maximum by default).
        var searchTitle = document.getElementById("search-title").value;
        if (searchTitle.length !== 0) searchObj.title = searchTitle;

        searchObj.rating = ratingSlider.noUiSlider.get();
        searchObj.year = yearSlider.noUiSlider.get();

        var filterGenre = Array.from(document.querySelectorAll(".filter-genre:checked")).map(function (val) {
            return val.value;
        });
        if (filterGenre.length !== 0) searchObj.genre = filterGenre;

        var searchDirector = document.getElementById("search-director").value;
        if (searchDirector.length !== 0) searchObj.director = searchDirector;

        var searchStarring = document.getElementById("search-starring").value;
        if (searchStarring.length !== 0) searchObj.starring = searchStarring;

        //search object --> query string --> api.
        api.prepareURL(makeQueryString(searchObj));
        makeNew.resetSearchForm();
    }

    /**
     * Function that produces a querystring for the API instead of filtering the movie array client side.
     * * @param {arr} searchObj - what user is looking for
     */
    function makeQueryString(searchObj) {
        var queryString = "?";
        queryString += searchObj.title ? "title_like=" + qSpace(searchObj.title) : "";
        queryString += searchObj.director ? "&director_like=" + qSpace(searchObj.director) : "";
        queryString += searchObj.starring ? "&starring_like=" + qSpace(qComma(searchObj.starring)) : "";
        if (searchObj.genre) {
            searchObj.genre.forEach(function (el) {
                queryString += "&genre_like=" + el;
            });
        }
        queryString += "&year_gte=" + searchObj.year[0] + "&year_lte=" + searchObj.year[1];
        queryString += "&averageRating_gte=" + searchObj.rating[0] + "&averageRating_lte=" + searchObj.rating[1];
        return queryString;
    }

    /**
     * helper for query string
     */
    function qSpace(string) {
        return string.replace(/ /g, "+");
    }

    /**
     * helper for query string
     */
    function qComma(string) {
        return string.replace(/,/g, "&");
    }

    return {
        makeSearchObject: makeSearchObject,
        quickSearch: quickSearch
    };
}();

/**
 * Module #4 - print-to-screen. The main (public) function printMovies takes an array and prints each item to screen.
 * It also has some private helper methods. This module also contains other screen-related functions such as search and 
 * add box toggle for example.
 */
var print = function () {

    function setGradeColor(grade) {
        return grade > 5 ? "goodgrade" : "badgrade";
    }

    function printGenres(arr) {
        var genreCode = "";
        for (var el in arr) {
            genreCode += "<div class=\"genre-box\">" + arr[el] + "</div>";
        }
        return genreCode;
    }

    /**
     * checks if we aldready voted for a movie, in that case returns other code
     * @param {string} id 
     */
    function printRateIt(id) {
        if (store.haveYouVoted(id)) {
            return "<span class=\"inline-link\"><span class=\"badgrade\">&#10084;</span>  Rated!</span>";
        }
        return "\n                <a class=\"inline-link rate-btn\" data-id=\"" + id + "\"> &#10148; Rate it!</a>\n                <select id=\"selectId-" + id + "\">\n                    <option value=\"1\">1</option>\n                    <option value=\"2\">2</option>\n                    <option value=\"3\">3</option>\n                    <option value=\"4\">4</option>\n                    <option value=\"5\" selected=\"selected\">5</option>\n                    <option value=\"6\">6</option>\n                    <option value=\"7\">7</option>\n                    <option value=\"8\">8</option>\n                    <option value=\"7\">7</option>\n                    <option value=\"8\">8</option>\n                    <option value=\"9\">9</option>\n                    <option value=\"10\">10</option>\n                </select>\n                ";
    }

    /**
     * Function for rendering the genre boxes in the modal dynamically based on aldready aquired genres.
     * @param {array} movies - all movies printed
     */
    function renderGenresModal(movies) {

        document.querySelectorAll(".edit-genre-button").forEach(function (el) {
            el.addEventListener("click", function () {
                //extracting the id from the button clicked
                var targetId = parseInt(el.id.split("-")[1]);
                //filtering out the movie with the same id
                var targetMovie = movies.filter(function (el) {
                    if (el.id === targetId) return el;
                });
                //It now lives in an array with only one object [0]
                var curGenre = targetMovie[0].genre;
                var allGenres = ["Drama", "Romantic", "Comedy", "Thriller", "Action", "Horror", "Sci-fi", "Documentary", "Animated", "Kids"];
                var genreBoxes = "";
                document.getElementById("edit-genre-title").innerHTML = "Edit genres for: " + targetMovie[0].title;
                //looping through all genres to find out which ones the movie already has
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = allGenres[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var thisGenre = _step.value;

                        var added = false;
                        //by looping through its genres each time.
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = curGenre[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var has = _step2.value;

                                if (thisGenre == has) {
                                    genreBoxes += genreModalCode(thisGenre, targetId, "checked");
                                    added = true;
                                }
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
                                }
                            } finally {
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }

                        if (!added) genreBoxes += genreModalCode(thisGenre, targetId, "");
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                document.getElementById("edit-genre-modal-content").innerHTML = genreBoxes;
                document.getElementById("edit-genre-submit").setAttribute("data-id", targetId);
            });
        });
    }

    /**
     * prints all the checkboxes for edit genre
     * @param {string} genre - this genre
     * @param {number} id - this movie id
     * @param {string} checked - "checked" or "";
     */
    function genreModalCode(genre, id, checked) {
        return "<div class=\"form-check-inline\">\n            <label class=\"form-check-label add-genre\">\n            <input type=\"checkbox\" class=\"edit-genre-" + id + " form-check-input\" value=\"" + genre + "\" " + checked + ">" + genre + "\n            </label>\n        </div>";
    }

    /**
     * joins several actors to a string
     * @param {object} val 
     */
    function joinArray(val) {
        if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === "object") {
            return val.join(", ");
        }
        return val;
    }

    return {

        /**
         * prints the movie cards
         */
        printMovies: function printMovies(movies) {
            var moviesToPrint = movies;
            var wrapper = document.getElementById("movie-wrapper");
            wrapper.innerHTML = "";
            if (moviesToPrint.length === 0) {
                wrapper.innerHTML = "<p id=\"no-result\">Sorry, no result</p>";
            } else {

                /* I want the latest movies to be displayed first. But in creation the movies are pushed into the array 
                so that their id:s are the same as their index. That's why the array is printed out in reverse.*/
                for (var i = moviesToPrint.length - 1; i >= 0; i--) {
                    var movie = moviesToPrint[i];

                    wrapper.innerHTML += "\n        <div class=\"card moviebox\">\n            <div class=\"card-block card-block-poster\">\n                <img src=\"" + movie.cover + "\" class=\"movie-cover\" alt=\"" + movie.title + "\"/>\n            </div>\n            <div class=\"card-block card-block-content\">\n                <h4 class=\"title\">" + movie.title + " <span class=\"tone-down\">(" + movie.year + ")</span></h4>\n                <p>Director: <span class=\"credits tone-down\">" + movie.director + "</span></p>\n                <p>Starring: <span class=\"credits tone-down\">" + joinArray(movie.starring) + "</span></p>        \n                </div>\n                <div class=\"card-footer card-footer-genres\">\n                    " + printGenres(movie.genre) + "\n            </div>\n                \n            <div class=\"card-footer card-footer-rating\">\n                <div class=\"nobreak\"><p>Rating: <span class=\"" + setGradeColor(movie.averageRating) + "\">" + movie.averageRating + "</span>\n                <span class=\"credits tone-down\"> (" + movie.rating.length + " votes)</span>\n            </p>\n            </div>\n            </div>\n            \n            <div class=\"card-footer d-flex justify-content-between\">\n            <div class=\"nobreak\">\n            <a class=\"inline-link edit-genre-button\" id=\"openGenreBox-" + movie.id + "\" data-toggle=\"modal\" data-target=\"#edit-genre-modal\">&#10148; Edit genre</a> \n            |\n                " + printRateIt(movie.id) + "\n            </div>\n            </div>          \n            </div>\n\n                ";
                }
            }
            //DONT KNOW IF THERE'S A NEED FOR CURRENT SELECTION ANYMORE
            //store.storeCurrentSelection(moviesToPrint);
            renderGenresModal(moviesToPrint);
            store.addRating(moviesToPrint);
        },

        showSpinner: function showSpinner() {
            var spinner = document.getElementById("spinner");
            spinner.classList.remove("hidden");
            spinner.classList.add("visible");
        },

        hideSpinner: function hideSpinner() {
            var spinner = document.getElementById("spinner");
            spinner.classList.remove("visible");
            spinner.classList.add("hidden");
        }
    };
}();

//-----------------------------------------------//

//Sliders for the search. Only possible to get values, no input allowed.
//Made using the noUISlider library - https://refreshless.com/nouislider/
//with help from the wNumb number formatting library - https://refreshless.com/wnumb/
//These libraries use the factory pattern, so I make two of my own sliders using Object.create() and some customizing.


var yearSlider = document.getElementById("slider-year");
var ratingSlider = document.getElementById("slider-rating");

noUiSlider.create(yearSlider, {
    start: [1920, 2020],
    connect: true,
    step: 1,
    tooltips: [true, true],
    range: {
        'min': 1920,
        'max': 2020
    },
    format: wNumb({
        decimals: 0
    }),
    pips: {
        mode: 'positions',
        values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    }
});

noUiSlider.create(ratingSlider, {
    start: [1, 10],
    connect: true,
    step: 1,
    tooltips: [true, true],
    range: {
        'min': 1,
        'max': 10
    },
    format: wNumb({
        decimals: 0
    }),
    pips: {
        mode: 'values',
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        density: 10,
        stepped: true
    }
});