"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

//Event handlers that handles page load, submit movie button, search submit, feature "buttons" on page header and toggling of form fields.
(function () {
    window.addEventListener("DOMContentLoaded", function () {
        return store.refreshMovies(store.getAllMovies());
    });
    document.getElementById("add-submit").addEventListener("click", function () {
        var title = document.getElementById("add-title").value;
        title.length === 0 ? alert("Please provide a title for your movie!") : makeNew.makeMovie();
    });

    document.getElementById("search-submit").addEventListener("click", function () {
        return search.makeSearchObject();
    });
    document.getElementById("show-all-movies").addEventListener("click", function () {
        return store.refreshMovies(store.getAllMovies());
    });
    // document.getElementById("get-best-rated").addEventListener("click", () => store.refreshMovies(store.getTopRatedMovie()));
    // document.getElementById("get-lowest-rated").addEventListener("click", () => store.refreshMovies(store.getWorstRatedMovie()));

    // Array.from(document.getElementsByClassName("toggleButton")).forEach((el) => {
    //     el.addEventListener("click", () => {
    //         print.toggleBox(event.target);
    //     });
    // });
})();

/*Module #1 - make new movies. The add form input is collected and made into an object using a constructor and some helper methods which are set to 
the constructor prototype. To have the constructor inside a closure is also handy because local var idCounter can be stored outside and provide 
a unique id to every object passing through the constructor (would otherwise have been reset). The movies are then passed on to the storage. */

var makeNew = function () {
    var idCounter = -1;

    function Movie(title, rating, year, genre, cover, director, starring) {
        this.title = title;
        this.rating = [rating];
        this.year = year;
        this.director = director;
        this.starring = starring;
        this.genre = genre;
        this.cover = cover;
        this.id = idCounter++;
        this.averageRating = this.getAverageRating();
    }

    Movie.prototype.getAverageRating = function () {
        var rating = parseFloat((this.rating.reduce(function (prev, cur) {
            return prev + cur;
        }) / this.rating.length).toFixed(1));
        return rating;
    };

    Movie.prototype.makeArray = function (string) {
        return string.split(", ");
    };

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

        store.addMovie(newMovie);
        store.refreshMovies(store.getAllMovies());
        // print.toggleBox();
        document.getElementById("add-movie-form").reset();
    }

    return {
        makeMovie: makeMovie,
        Movie: Movie
    };
}();

/*module #2 - Database. My existing movies are tucked away in storage here with no risk of manipulation once created.
The module is providing public endpoints which are basically CRUD-methods (minus delete) to meet my specific needs*/

var store = function () {
    //This is the array where all the movies are stored.
    var movieDatabase = [];
    //This is the array of our current selection
    var currentSelection = [];

    return {
        getAllMovies: function getAllMovies() {
            return movieDatabase;
        },
        getTopRatedMovie: function getTopRatedMovie() {
            var allMovies = this.getAllMovies();
            var topRatedArr = [];
            topRatedArr.push(allMovies.reduce(function (prev, cur) {
                return prev.averageRating > cur.averageRating ? prev : cur;
            }));
            return topRatedArr;
        },
        getWorstRatedMovie: function getWorstRatedMovie() {
            var allMovies = this.getAllMovies();
            var lowRatedArr = [];
            lowRatedArr.push(allMovies.reduce(function (prev, cur) {
                return prev.averageRating < cur.averageRating ? prev : cur;
            }));
            return lowRatedArr;
        },
        refreshMovies: function refreshMovies(movies) {
            return print.printMovies(movies);
        },

        addMovie: function addMovie(obj) {
            movieDatabase.push(obj);
        },

        /* I failed to add event listeners dynamically to ratings/edit genre buttons, so i simply added onclick calls 
        with the button element passed on. it's id number is the same as the ratings property id and the target movie's index. 
        Maybe not the most solid solution but it works :/ */
        addRating: function addRating(button) {
            var id = parseInt(button.id.split("-")[1]);
            var rating = parseInt(document.getElementById("selectId-" + id).value);
            movieDatabase[id].rating.push(rating);
            movieDatabase[id].averageRating = movieDatabase[id].getAverageRating();
            return this.refreshMovies(this.getCurrentSelection());
            //Same solution here...
        },
        editGenre: function editGenre(button) {
            var id = parseInt(button.id.split("-")[1]);
            var addGenre = Array.from(document.querySelectorAll(".edit-genre-" + id + ":checked")).map(function (val) {
                return val.value;
            });
            movieDatabase[id].genre = addGenre;
            return this.refreshMovies(this.getCurrentSelection());
        },
        //stores and gets current selection to prevent all movies from showing up when we add a grade or genre.
        storeCurrentSelection: function storeCurrentSelection(arr) {
            this.currentSelection = arr;
        },
        getCurrentSelection: function getCurrentSelection() {
            return this.currentSelection;
        }
    };
}();

/*Module #3 - Search. This one ectracts the data from the search form making it a search object. It then sends the object to the performSearch
function that compares it to the movie databases' movie prop/values using some helper methods. It returns a search result array that is 
stored and sent to the print module.*/

var search = function () {

    //Kinda unnecessary to have a new constructor for the searches and make Movie it's prototype. I did this to 
    //give acess to Movie's makeArray function. Could have just made it a public function but this more fun :)
    function Search() {}
    Search.prototype = new makeNew.Movie();

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
        if (searchStarring.length !== 0) searchObj.starring = searchObj.makeArray(searchStarring);

        performSearch(searchObj, store.getAllMovies());
    }

    //All the movies are then filtered by the search object in this order: 
    //year interval, ratings interval, genres, director and title.
    function performSearch(find, all) {

        var searchResult = all.filter(function (val) {
            return val.year >= find.year[0] && val.year <= find.year[1];
        }).filter(function (val) {
            return val.averageRating >= find.rating[0] && val.averageRating <= find.rating[1];
        });

        if (find.hasOwnProperty("genre")) {
            searchResult = filterArray(find, searchResult, "genre");
        }
        if (find.hasOwnProperty("starring")) {
            searchResult = filterArray(find, searchResult, "starring");
        }
        if (find.hasOwnProperty("director")) {
            searchResult = searchString(find, searchResult, "director");
        }
        if (find.hasOwnProperty("title")) {
            searchResult = searchString(find, searchResult, "title");
        }

        store.refreshMovies(searchResult);
    }

    /* this is the function that took the longest time to figure out. It cross-filters two arrays and returns an element 
    (movie) only if it's present in the other (search). Had to make sure a result wasn't returned too early
    so I ended up with an indexOf-method in an if-statement inside a loop inside a filter method :) */
    function filterArray(find, all, prop) {
        return all.filter(function (val) {
            var add = false;
            for (var i in this[prop]) {
                if (val[prop].indexOf(this[prop][i]) > -1) {
                    add = true;
                }
            }
            return add;
        }, find);
    }

    function searchString(find, all, prop) {
        return all.filter(function (val, i) {
            return all[i][prop].toLowerCase() == find[prop].toLowerCase();
        });
    }

    return {
        makeSearchObject: makeSearchObject
    };
}();

/*Module #4 - print-to-screen. The main (public) function printMovies takes an array and prints each item to screen.
It also has some private helper methods. This module also contains other screen-related functions such as search and 
add box toggle for example. */

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

    //this very unpure and kinda tedious function renders the edit-genres-box for each movie. It's current genres has to be checked,  
    //hence all the looping.
    function printEditGenreBox(movie) {
        var curGenre = movie.genre;
        var allGenres = ["Drama", "Romantic", "Comedy", "Thriller", "Action", "Horror", "Sci-fi", "Documentary", "Animated", "Kids"];
        var genreBoxes = "";
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = allGenres[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var all = _step.value;

                var added = false;
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = curGenre[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var has = _step2.value;

                        if (all == has) {
                            genreBoxes += "<div class=\"genre\"><input type=\"checkbox\" class=\"edit-genre-" + movie.id + "\" value=\"" + all + "\" checked>" + all + "</div>";
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

                if (!added) genreBoxes += "<div class=\"genre\"><input type=\"checkbox\" class=\"edit-genre-" + movie.id + "\" value=\"" + all + "\">" + all + "</div>";
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

        return genreBoxes;
    }

    function toggleGenreBox(button) {
        var id = event.target.id.split("-")[1];
        var box = document.getElementById("edit-genre-box-" + id);
        box.classList.toggle("visible");
        box.classList.toggle("hidden");
    }

    function joinArray(val) {
        if ((typeof val === "undefined" ? "undefined" : _typeof(val)) === "object") {
            return val.join(", ");
        }
        return val;
    }

    return {
        printMovies: function printMovies(movies) {
            console.log(movies);
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

                    wrapper.innerHTML += "\n    <div class=\"card moviebox\">\n            <div class=\"card-block\">\n                <img src=\"" + movie.cover + "\" class=\"movie-cover\" alt=\"" + movie.title + "\"/>\n            </div>\n            <div class=\"card-block\">\n                <h4 class=\"title\">" + movie.title + " <span class=\"tone-down\">(" + movie.year + ")</span></h4>\n                <p>Director: <span class=\"credits tone-down\">" + movie.director + "</span></p>\n                <p>Starring: <span class=\"credits tone-down\">" + joinArray(movie.starring) + "</span></p>\n            </div>        \n            <div class=\"card-footer\">\n                <div>\n                    " + printGenres(movie.genre) + "\n                </div>\n            <div class=\"nobreak\"><p>Rating: <span class=\"" + setGradeColor(movie.averageRating) + "\">" + movie.averageRating + "</span>\n            <span class=\"credits tone-down\"> (" + movie.rating.length + " votes)</span>\n            </p>\n            </div>\n\n            <div>\n            <a class=\"inline-link\" id=\"openGenreBox-" + movie.id + "\" onclick=\"print.toggleGenreBox(this)\">&#10148; Edit genre</span></a> |\n                <a class=\"rateBtnClass inline-link\" id=\"rateBtnId-" + movie.id + "\" onclick=\"store.addRating(this)\"> &#10148; Rate it!</a>\n                <select id=\"selectId-" + movie.id + "\">\n                    <option value=\"1\">1</option>\n                    <option value=\"2\">2</option>\n                    <option value=\"3\">3</option>\n                    <option value=\"4\">4</option>\n                    <option value=\"5\" selected=\"selected\">5</option>\n                    <option value=\"6\">6</option>\n                    <option value=\"7\">7</option>\n                    <option value=\"8\">8</option>\n                    <option value=\"7\">7</option>\n                    <option value=\"8\">8</option>\n                    <option value=\"9\">9</option>\n                    <option value=\"10\">10</option>\n                </select>\n            </div>\n            <div class=\"hidden edit-genre-box\" id=\"edit-genre-box-" + movie.id + "\">" + printEditGenreBox(movie) + "\n                <a id=\"sumbitNewGenreId-" + movie.id + "\" class=\"inline-link\" onclick=\"store.editGenre(this)\">&#10148; Submit</button>\n                </a>\n            </div>\n            </div>          \n            </div>\n\n                ";
                }
            }
            //sends the current selection to storage so we can display it again.
            store.storeCurrentSelection(moviesToPrint);
        },
        // toggleBox: function(el) {
        //     let id = "add-movie-section";
        //     if (el.classList.contains("searchButton")) {
        //         $('#searchModal').modal('toggle');
        //         // id = "search-movie-section";
        //     }
        //     if (el.classList.contains("addButton")) {
        //         $('#addModal').modal('toggle');
        //     }
        //     let box = document.getElementById(id);
        //     // box.classList.toggle("active");
        //     // box.classList.toggle("visible");
        //     // box.classList.toggle("hidden");
        // },
        toggleGenreBox: toggleGenreBox
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