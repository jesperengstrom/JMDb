//event handlers
window.addEventListener("DOMContentLoaded", () => printModule.printMovies(movieModule.getAllMovies()));
document.getElementById("add-submit").addEventListener("click", createMovie);
document.getElementById("search-submit").addEventListener("click", advancedSearch);

Array.from(document.getElementsByClassName("toggleVisible")).forEach((el) => {
    el.addEventListener("click", () => {
        printModule.toggleBox();
    });
});

//*ADDING A MOVIE*

//Add form input enters here...

function createMovie() {
    let movieTitle = document.getElementById("add-title").value;
    let movieRating = document.getElementById("add-rating").value;
    let movieYear = document.getElementById("add-year").value;
    let movieDirector = document.getElementById("add-director").value;
    let movieStarring = document.getElementById("add-starring").value;
    let movieGenre = Array.from(document.querySelectorAll(".add-genre:checked")).map((val) => { return val.value; });
    let movieCover = document.getElementById("add-cover").value;
    let newMovie = new Movie(movieTitle, movieRating, movieYear, movieDirector, movieStarring, movieGenre, movieCover);
    newMovie.prepareStrings();
    printModule.toggleBox();
    document.getElementById("add-movie-form").reset();
}

// ...is sent into constructor

//CONSTRUCTOR PATTERN
//My movies-constructor for making new movie-objects
//and prototype function for formatting the input correctly

function Movie(title, rating, year, director, starring, genre, cover) {
    this.title = title;
    this.rating = [rating];
    this.year = year;
    this.director = director;
    this.starring = starring;
    this.genre = genre;
    this.cover = cover;
}

Movie.prototype.prepareStrings = function(movie) {
    this.starring = this.starring.split(", ");
    movieModule.addMovie(this);
};

//...and into storage

//MODULE PATTERN
//MovieModule - My database of existing movies, tucked away in a module so data is safe
//providing public "endpoints" to get all movies, get some movies (filted) and addding a movie.

var movieModule = (function() {
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
            console.log(movieDatabase);
            return printModule.printMovies(movies);
        }
    };
})();

//*RENDERING MOVIES*

//...where it's fetched by print-to-screen module
//Only printing + display functions need to be public, other ones are internal

var printModule = (function() {

    //some pure helper functions
    function calcRating(arr) {
        let rating = (arr.reduce((prev, cur) => prev + cur) / arr.length).toFixed(1);
        return rating;
    }
    //unpure helper functions
    function setGradeColor(grade) {
        return grade > 5 ? "goodgrade" : "badgrade";
    }

    function printGenres(arr) {
        let genreCode = "";
        for (let el in arr) {
            genreCode += `<div class="genre-box">${arr[el]}</div>`;
        }
        genreCode += `<span class="inline-link"><a href="#">Edit genre</a></span>`
        return genreCode;
    }

    return {
        printMovies: function(movies) {
            var moviesToPrint = movies;
            var wrapper = document.getElementById("movie-wrapper");
            wrapper.innerHTML = "";
            for (let movie of moviesToPrint) {
                //let filteredRating = movie.rating.filter((val) => val !== undefined); //kanske kan tas bort senare

                wrapper.innerHTML += `<div class="moviebox">
                                <img src="${movie.cover}" class="movie-cover" alt="${movie.title}"/>
                                <h4 class="title">${movie.title} <span class="tone-down">(${movie.year})</span></h4>
                                <p class="credits tone-down">Director: ${movie.director}</p>
                                <p class="credits tone-down">Starring: ${movie.starring.join(", ")}</p>
                                ${printGenres(movie.genre)}
                                <p class="credits tone-down">Rating: <span class="${setGradeColor(calcRating(movie.rating))}">${calcRating(movie.rating)}</span> (${movie.rating.length} votes)</p></div>`
            }
        },
        toggleBox: function() {
            let addBox = document.getElementById("add-movie-section");
            addBox.classList.toggle("visible");
            addBox.classList.toggle("hidden");
        }
    };
})();

//pre-existing movie objects

var jurassicPark = new Movie("Jurassic Park", 5, 1993, "Steven Spielberg", "Sam Neill, Laura Dern", ["Action", "Thriller", "Sci-fi"], "https://upload.wikimedia.org/wikipedia/en/e/e7/Jurassic_Park_poster.jpg");
jurassicPark.prepareStrings();


//Sliders for advanced search - tucked in a module. Only possible to get values, no input.
//using noUISlider library - https://refreshless.com/nouislider/
//with wNumb number formatting library for comfort - https://refreshless.com/wnumb/
//I make two of my own slider objects using factory pattern and a simple API for customizing
var sliderModule = (function() {
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
    return {


    };
})();