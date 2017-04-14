//Event listeners that handles page load, submit movie button, search submit, feature "buttons" on page header and toggling of form fields.
(function() {
    //original domready call
    // window.addEventListener("DOMContentLoaded", () => store.refreshMovies(store.getAllMovies()));
    //new api solution
    window.addEventListener("DOMContentLoaded", () => api.getAllMovies());

    //event listener for add new movie submit button
    document.getElementById("add-submit").addEventListener("click", () => {
        let title = document.getElementById("add-title").value;
        title.length === 0 ? alert("Please provide a title for your movie!") : makeNew.makeMovie();
    });

    //listener for add cancel
    document.getElementById("add-cancel").addEventListener("click", () => makeNew.resetAddForm());

    //event listener for advanced search submit button
    document.getElementById("search-submit").addEventListener("click", () => search.makeSearchObject());

    //event listener for "show all movies". Retrieves local array, no new GET-request
    document.getElementById("show-all-movies").addEventListener("click", () => store.refreshMovies(store.getAllMovies()));

    // event listeners for disabled top rated & lowest rated functions
    // document.getElementById("get-best-rated").addEventListener("click", () => store.refreshMovies(store.getTopRatedMovie()));
    // document.getElementById("get-lowest-rated").addEventListener("click", () => store.refreshMovies(store.getWorstRatedMovie()));

    //event listeners for old add & search windows
    // Array.from(document.getElementsByClassName("toggleButton")).forEach((el) => {
    //     el.addEventListener("click", () => {
    //         print.toggleBox(event.target);
    //     });
    // });

})();

/*Module #1 - make new movies. The add form input is collected and made into an object using a constructor and some helper methods which are set to 
the constructor prototype. To have the constructor inside a closure is also handy because local var idCounter can be stored outside and provide 
a unique id to every object passing through the constructor (would otherwise have been reset). The movies are then passed on to the storage. */

var makeNew = (function() {
    var idCounter = -1;

    function Movie(title, rating, year, genre, cover, director, starring) {
        this.title = title;
        this.rating = [rating];
        this.year = year;
        this.director = director;
        this.starring = starring;
        this.genre = genre;
        this.cover = cover;
        //this.id = idCounter++;
        this.averageRating = this.getAverageRating();
    }

    Movie.prototype.getAverageRating = function() {
        let rating = parseFloat((this.rating.reduce((prev, cur) => prev + cur) / this.rating.length).toFixed(1));
        return rating;
    };

    Movie.prototype.makeArray = function(string) {
        return string.split(", ");
    };

    /**
     * Runs when "submit-movie" button is clicked.
     */
    function makeMovie() {
        let movieTitle = document.getElementById("add-title").value;
        let movieRating = parseInt(document.getElementById("add-rating").value);
        let movieYear = parseInt(document.getElementById("add-year").value);
        let movieGenre = Array.from(document.querySelectorAll(".add-genre:checked")).map((val) => { return val.value; });
        let movieCover = document.getElementById("add-cover").value;
        let movieDirector = ("") ? undefined : document.getElementById("add-director").value;
        let movieStarring = document.getElementById("add-starring").value;

        var newMovie = new Movie(movieTitle, movieRating, movieYear, movieGenre, movieCover, movieDirector, movieStarring);
        newMovie.starring = newMovie.makeArray(newMovie.starring);

        //used to happen when a new movie was created
        // store.addMovie(newMovie);
        // store.refreshMovies(store.getAllMovies());
        // print.toggleBox();

        api.postMovie(newMovie);
        resetAddForm();

    }

    /**
     * tedious way to reset the form
     */
    function resetAddForm() {
        let inputs = document.querySelectorAll("#add-movie-form input");
        inputs.forEach((el) => {
            if (el.type == "text" || el.type == "url") el.value = "";
            if (el.type == "checkbox") el.checked = false;
            if (el.type == "number") el.value = 2017;
        });
        document.querySelectorAll("#add-rating option").forEach((el) => {
            if (el.value == "5") el.selected = "selected";
        });
    }

    return {
        makeMovie: makeMovie,
        Movie: Movie,
        resetAddForm: resetAddForm
    };
})();


/*module #2 - Database. My existing movies are tucked away in storage here with no risk of manipulation once created.
The module is providing public endpoints which are basically CRUD-methods (minus delete) to meet my specific needs*/

var store = (function() {
    //This is the array where all the movies are stored.
    var movieDatabase = [];
    //This is the array of our current selection
    var currentSelection = [];

    return {
        getAllMovies: function() {
            return movieDatabase;

        },
        getTopRatedMovie: function() {
            let allMovies = this.getAllMovies();
            let topRatedArr = [];
            topRatedArr.push(allMovies.reduce(function(prev, cur) {
                return prev.averageRating > cur.averageRating ? prev : cur;
            }));
            return topRatedArr;

        },
        getWorstRatedMovie: function() {
            let allMovies = this.getAllMovies();
            let lowRatedArr = [];
            lowRatedArr.push(allMovies.reduce(function(prev, cur) {
                return prev.averageRating < cur.averageRating ? prev : cur;
            }));
            return lowRatedArr;

        },
        refreshMovies: function(movies) {
            return print.printMovies(movies);
        },

        //riginal function pushing movies to array REMOVE?
        addMovie: function(obj) {
            movieDatabase.push(obj);
        },

        /**
         * gets an array from the api, stores and sends to print
         */
        storeAllMovies: function(movies) {
            movieDatabase = movies;
            store.refreshMovies(movieDatabase);

        },

        /* I failed to add event listeners dynamically to ratings/edit genre buttons, so i simply added onclick calls 
        with the button element passed on. it's id number is the same as the ratings property id and the target movie's index. 
        Maybe not the most solid solution but it works :/ */
        addRating: function(button) {
            let id = parseInt(button.id.split("-")[1]);
            let rating = parseInt(document.getElementById("selectId-" + id).value);
            movieDatabase[id].rating.push(rating);
            movieDatabase[id].averageRating = movieDatabase[id].getAverageRating();
            return this.refreshMovies(this.getCurrentSelection());
            //Same solution here...
        },
        editGenre: function(button) {
            let id = parseInt(button.id.split("-")[1]);
            let addGenre = Array.from(document.querySelectorAll(".edit-genre-" + id + ":checked")).map((val) => { return val.value; });
            movieDatabase[id].genre = addGenre;
            return this.refreshMovies(this.getCurrentSelection());
        },
        //stores and gets current selection to prevent all movies from showing up when we add a grade or genre.
        storeCurrentSelection: function(arr) {
            this.currentSelection = arr;
        },
        getCurrentSelection: function() {
            return this.currentSelection;
        }
    };
})();


/*Module #3 - Search. This one ectracts the data from the search form making it a search object. It then sends the object to the performSearch
function that compares it to the movie databases' movie prop/values using some helper methods. It returns a search result array that is 
stored and sent to the print module.*/

var search = (function() {

    //Kinda unnecessary to have a new constructor for the searches and make Movie it's prototype. I did this to 
    //give acess to Movie's makeArray function. Could have just made it a public function but this more fun :)
    function Search() {}
    Search.prototype = new makeNew.Movie();

    function makeSearchObject() {
        var searchObj = new Search();

        //rest of this func checks if the input fields have something in them. if not, that search property will be left out.
        //year and ratings span do always have a value (and is set to maximum by default).
        let searchTitle = document.getElementById("search-title").value;
        if (searchTitle.length !== 0) searchObj.title = searchTitle;

        searchObj.rating = ratingSlider.noUiSlider.get();
        searchObj.year = yearSlider.noUiSlider.get();

        let filterGenre = Array.from(document.querySelectorAll(".filter-genre:checked")).map((val) => { return val.value; });
        if (filterGenre.length !== 0) searchObj.genre = filterGenre;

        let searchDirector = document.getElementById("search-director").value;
        if (searchDirector.length !== 0) searchObj.director = searchDirector;

        let searchStarring = document.getElementById("search-starring").value;
        if (searchStarring.length !== 0) searchObj.starring = searchObj.makeArray(searchStarring);

        performSearch(searchObj, store.getAllMovies());
    }

    //All the movies are then filtered by the search object in this order: 
    //year interval, ratings interval, genres, director and title.
    function performSearch(find, all) {

        var searchResult = all.filter((val) => val.year >= find.year[0] && val.year <= find.year[1])
            .filter((val) => (val.averageRating >= find.rating[0] && val.averageRating <= find.rating[1]));

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
        return all.filter(function(val) {
            let add = false;
            for (let i in this[prop]) {
                if (val[prop].indexOf(this[prop][i]) > -1) {
                    add = true;
                }
            }
            return add;
        }, find);
    }

    function searchString(find, all, prop) {
        return all.filter(function(val, i) {
            return all[i][prop].toLowerCase() == find[prop].toLowerCase();
        });
    }

    return {
        makeSearchObject: makeSearchObject,
    };
})();

/*Module #4 - print-to-screen. The main (public) function printMovies takes an array and prints each item to screen.
It also has some private helper methods. This module also contains other screen-related functions such as search and 
add box toggle for example. */

var print = (function() {

    function setGradeColor(grade) {
        return grade > 5 ? "goodgrade" : "badgrade";
    }

    function printGenres(arr) {
        let genreCode = "";
        for (let el in arr) {
            genreCode += `<div class="genre-box">${arr[el]}</div>`;
        }
        return genreCode;
    }

    //this very unpure and kinda tedious function renders the edit-genres-box for each movie. It's current genres has to be checked,  
    //hence all the looping.
    function printEditGenreBox(movie) {
        let curGenre = movie.genre;
        let allGenres = ["Drama", "Romantic", "Comedy", "Thriller", "Action", "Horror", "Sci-fi", "Documentary", "Animated", "Kids"];
        let genreBoxes = "";
        for (let all of allGenres) {
            let added = false;
            for (let has of curGenre) {
                if (all == has) {
                    genreBoxes += `<div class="genre"><input type="checkbox" class="edit-genre-${movie.id}" value="${all}" checked>${all}</div>`;
                    added = true;
                }
            }
            if (!added) genreBoxes += `<div class="genre"><input type="checkbox" class="edit-genre-${movie.id}" value="${all}">${all}</div>`;
        }
        return genreBoxes;
    }

    function toggleGenreBox(button) {
        let id = event.target.id.split("-")[1];
        let box = document.getElementById("edit-genre-box-" + id);
        box.classList.toggle("visible");
        box.classList.toggle("hidden");
    }

    function joinArray(val) {
        if (typeof val === "object") {
            return val.join(", ");
        }
        return val;
    }

    return {
        printMovies: function(movies) {
            console.log(movies);
            var moviesToPrint = movies;
            var wrapper = document.getElementById("movie-wrapper");
            wrapper.innerHTML = "";
            if (moviesToPrint.length === 0) {
                wrapper.innerHTML = `<p id="no-result">Sorry, no result</p>`;
            } else {

                /* I want the latest movies to be displayed first. But in creation the movies are pushed into the array 
                so that their id:s are the same as their index. That's why the array is printed out in reverse.*/
                for (let i = moviesToPrint.length - 1; i >= 0; i--) {
                    let movie = moviesToPrint[i];

                    wrapper.innerHTML += `
    <div class="card moviebox">
            <div class="card-block">
                <img src="${movie.cover}" class="movie-cover" alt="${movie.title}"/>
            </div>
            <div class="card-block">
                <h4 class="title">${movie.title} <span class="tone-down">(${movie.year})</span></h4>
                <p>Director: <span class="credits tone-down">${movie.director}</span></p>
                <p>Starring: <span class="credits tone-down">${joinArray(movie.starring)}</span></p>
            </div>        
            <div class="card-footer">
                <div>
                    ${printGenres(movie.genre)}
                </div>
            <div class="nobreak"><p>Rating: <span class="${setGradeColor(movie.averageRating)}">${movie.averageRating}</span>
            <span class="credits tone-down"> (${movie.rating.length} votes)</span>
            </p>
            </div>

            <div>
            <a class="inline-link" id="openGenreBox-${movie.id}" onclick="print.toggleGenreBox(this)">&#10148; Edit genre</span></a> |
                <a class="rateBtnClass inline-link" id="rateBtnId-${movie.id}" onclick="store.addRating(this)"> &#10148; Rate it!</a>
                <select id="selectId-${movie.id}">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5" selected="selected">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>
            </div>
            <div class="hidden edit-genre-box" id="edit-genre-box-${movie.id}">${printEditGenreBox(movie)}
                <a id="sumbitNewGenreId-${movie.id}" class="inline-link" onclick="store.editGenre(this)">&#10148; Submit</button>
                </a>
            </div>
            </div>          
            </div>

                `;
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
})();


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
        values: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
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