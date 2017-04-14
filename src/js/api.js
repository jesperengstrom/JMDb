var api = (function() {
    var heroku = "https://jmdb.herokuapp.com/movies/";

    return {


        //this is a fetch function - replacing it with a jq one for better support
        // getAllMovies: function() {
        //     fetch(heroku)
        //         .then(function(response) {
        //             return response.json();
        //         }).then(function(json) {
        //             store.storeAllMovies(json);
        //         });
        // },

        /**
         * GETs all movies from the API
         */
        getAllMovies: function() {
            $.getJSON({
                url: heroku,
                success: (fetchedMovies) => {
                    store.storeAllMovies(fetchedMovies);
                },
                error: (error) => {
                    alert("There was a problem with loading the movies: ", error);
                }
            });
        },

        postMovie: function(movie) {
            $.ajax({
                method: "POST",
                url: heroku,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify(movie),
                success: (response) => {
                    console.log("successfully posted:", response);
                    //fetching all movies once again
                    api.getAllMovies();
                },
                error: (error) => {
                    alert("Oh no, there was an error posting your movie:", error);
                }
            });
        }
    };
})();