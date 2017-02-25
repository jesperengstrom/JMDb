//event handlers
window.addEventListener("DOMContentLoaded", () => store.refreshMovies(store.getAllMovies()));
document.getElementById("add-submit").addEventListener("click", () => makeNew.makeMovie());
document.getElementById("search-submit").addEventListener("click", () => search.makeSearchObject());

Array.from(document.getElementsByClassName("toggleVisible")).forEach((el) => {
    el.addEventListener("click", () => {
        print.toggleBox();
    });
});

/*I basically have a number modules that handle all functionality, for grouping and privacy puropses: 
as much as possible of their variables and functions are private, they have a public API with functions necessary to communicate with each other.

MAKE NEW. Revealing module pattern. All form makeNew (both add and search) are modified and made into objects using a CONSTRUCTOR
inside the module. It is then passed on to... */

var makeNew = (function() {
    function Movie(title, rating, year, genre, cover = "images/nocover.jpg", director = "N/A", starring = "N/A") {
        this.title = title;
        this.rating = [rating];
        this.year = year;
        this.director = director;
        this.starring = starring;
        this.genre = genre;
        this.cover = cover;
    }

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

        store.addMovie(newMovie);
        print.toggleBox();
        document.getElementById("add-movie-form").reset();
        /*if (title.length !== 0) newMovie.title = title;
        if (rating.length !== 0) newMovie.rating = [rating];
        if (year.length !== 0) newMovie.year = year;
        if (genre.length !== 0) newMovie.genre = genre;
        if (cover.length !== 0) newMovie.cover = cover;
        if (director.length !== 0) newMovie.director = director;
        if (starring.length !== 0) newMovie.starring = newMovie.makeArray(starring);*/
    }

    Movie.prototype.makeArray = function(string) {
        return string.split(", ");
    }

    return {
        makeMovie: makeMovie,
        Movie: Movie
    };
})();

//SEARCH

var search = (function() {
    //Kinda unnecessary to make a new prototype for the searches and make Movie it's prototype. I did this to 
    //give acess to Movie's makeArray function. Could have just made it a public function but this more fun :)
    function Search() {}
    Search.prototype = new makeNew.Movie();

    function makeSearchObject() {
        var searchObj = new Search();

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

    //filter by year interval, ratings interval, genres, 

    function performSearch(find, all) {
        var searchResult = all.filter((val) => val.year >= find.year[0] && val.year <= find.year[1])
            .filter((val) => (print.publicCalcRating(val.rating) >= find.rating[0] && print.publicCalcRating(val.rating) <= find.rating[1]));

        if (find.hasOwnProperty("genre")) {
            searchResult = filterArray(find, searchResult, "genre");
        }

        if (find.hasOwnProperty("starring")) {
            console.log("has starring");
            searchResult = filterArray(find, searchResult, "starring");
        }

        store.refreshMovies(searchResult);
    }

    function filterArray(find, all, prop) {
        return all.filter(function(val) {
            let add = false;
            for (var i in this[prop]) {
                //console.log("looking for " + this.starring[i] + " and currently looking at " + val.starring);
                if (val[prop].indexOf(this[prop][i]) > -1) {
                    add = true;
                }
            }
            return add;
        }, find);
    }

    return {
        makeSearchObject: makeSearchObject,
    };
})();



/*DATABASE. Module pattern. 
My existing movies are tucked away in storage here with no risk of manipulation once created.
The module is providing public endpoints to add a movie, get all movies, get some movies (filtered) and refreshing the list. 
Data is sent from here to...*/

var store = (function() {
    var movieDatabase = [{
        title: "Silence Of The Lambs",
        rating: [7, 8, 9, 6],
        year: 1991,
        director: "Jonathan Demme",
        starring: ["Jodie Foster", "Anthony Hopkins"],
        genre: ["Horror", "Thriller"],
        cover: "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg"
    }, ];
    return {
        addMovie: function(obj) {
            movieDatabase.unshift(obj);
            return this.refreshMovies(this.getAllMovies());
        },
        getAllMovies: function() {
            return movieDatabase;
        },
        refreshMovies: function(movies) {
            //console.log(movies);
            return print.printMovies(movies);
        }
    };
})();

//3. PRINT-TO-SCREEN. Module pattern.
//Where all the object from storage are rendered. Only printing + display functions need to be public, other ones are internal

var print = (function() {

    function setGradeColor(grade) {
        return grade > 5 ? "goodgrade" : "badgrade";
    }

    function printGenres(arr) {
        let genreCode = "";
        for (let el in arr) {
            genreCode += `<div class="genre-box">${arr[el]}</div>`;
        }
        genreCode += `<span class="inline-link"><a href="#">Edit genre</a></span>`;
        return genreCode;
    }

    function joinArray(val) {
        if (typeof val === "object") {
            return val.join(", ");
        }
        return val;
    }

    function calcRating(arr) {
        let rating = parseFloat((arr.reduce((prev, cur) => prev + cur) / arr.length).toFixed(1));
        return rating;
    }

    return {
        printMovies: function(movies) {
            var moviesToPrint = movies;
            var wrapper = document.getElementById("movie-wrapper");
            wrapper.innerHTML = "";
            if (moviesToPrint.length === 0) {
                wrapper.innerHTML = `<p>No result</p>`;
            } else {

                for (let movie of moviesToPrint) {
                    //let filteredRating = movie.rating.filter((val) => val !== undefined); //kanske kan tas bort senare

                    wrapper.innerHTML += `<div class="moviebox">
                                <img src="${movie.cover}" class="movie-cover" alt="${movie.title}"/>
                                <h4 class="title">${movie.title} <span class="tone-down">(${movie.year})</span></h4>
                                <p>Director: <span class="credits tone-down">${movie.director}</span></p>
                                <p>Starring: <span class="credits tone-down">${joinArray(movie.starring)}</span></p>
                                ${printGenres(movie.genre)}
                                <p>Rating: <span class="${setGradeColor(calcRating(movie.rating))}">${calcRating(movie.rating)}</span><span class="credits tone-down"> (${movie.rating.length} votes)</span></p></div>`;
                }
            }
        },
        toggleBox: function() {
            let addBox = document.getElementById("add-movie-section");
            addBox.classList.toggle("visible");
            addBox.classList.toggle("hidden");
        },
        publicCalcRating: calcRating
    };
})();



//pre-defined movie objects initializing the constructor.
store.addMovie(new makeNew.Movie("Jurassic Park", 7, 1993, ["Action", "Thriller", "Sci-fi"], "https://upload.wikimedia.org/wikipedia/en/e/e7/Jurassic_Park_poster.jpg", "Steven Spielberg", ["Sam Neill", "Laura Dern"]));
store.addMovie(new makeNew.Movie("Annie Hall", 8, 1977, ["Comedy"], "https://web.calstatela.edu/library/mmc/100/annie_hall.jpg", "Woody Allen", ["Woody Allen", "Diane Keaton"]));
store.addMovie(new makeNew.Movie("Reine och Mimmi i fjällen", 1, 1997, ["Comedy"], "http://s0.discshop.se/img/front_large/33020/reine_mimmi_i_fjallen.jpg", "Magnus Skogsberg", ["Bertram Heribertson", "Ing-Marie Carlsson"]));



//-----------------------------------------------//

//Sliders for advanced search. Only possible to get values, no makeNew.
//using noUISlider library - https://refreshless.com/nouislider/
//with wNumb number formatting library for comfort - https://refreshless.com/wnumb/
//They use the factory pattern, so I make two of my own sliders using Object.create() and some customizing.

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