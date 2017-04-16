var api = (function() {
    var server = "https://jmdb.herokuapp.com/movies/";

    //an alternative server, maybe this one doesn't erase my files
    //server = "https://api.myjson.com/bins/10h80z";

    return {
        /**
         * GETs all movies from the API
         */
        getAllMovies: function() {
            $.getJSON({
                url: server,
                success: (fetchedMovies) => {
                    console.log(fetchedMovies);
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
                url: server,
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
        },

        patchMovie: function(id, patchObj) {
            console.log(patchObj);
            $.ajax({
                method: "PATCH",
                url: server + "/" + id,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify(patchObj),
                success: (response) => {
                    console.log("successfully patched:", response);
                    //fetching all movies once again
                    api.getAllMovies();
                },
                error: (error) => {
                    alert("Oh no, there was an error patching your movie:", error);
                }
            });

        }
    };
})();