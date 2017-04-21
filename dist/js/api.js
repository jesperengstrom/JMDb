"use strict";

var api = function () {
    //var server = "https://jmdb.herokuapp.com/movies";
    var server = "https://jmdb.azurewebsites.net/movies";

    //backup
    //server = "https://api.myjson.com/bins/10h80z";

    return {
        /**
         * GETs all movies from the API
         * sometimes gets a querystring for search, otherwise just gets all
         */
        getMovies: function getMovies(query) {
            var thisUrl = server;
            if (query) thisUrl += query;

            $.getJSON({
                url: thisUrl,
                beforeSend: function beforeSend() {
                    print.showSpinner();
                },
                success: function success(fetchedMovies) {
                    console.log("fetched from: ", thisUrl, fetchedMovies);
                    store.storeMovies(fetchedMovies);
                },
                complete: function complete() {
                    print.hideSpinner();
                },
                error: function error(_error) {
                    alert("There was a problem with loading the movies: ", _error);
                }
            });
        },

        postMovie: function postMovie(movie) {
            $.ajax({
                method: "POST",
                url: server,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify(movie),
                beforeSend: function beforeSend() {
                    print.showSpinner();
                },
                success: function success(response) {
                    console.log("successfully posted:", response);
                    //fetching all movies once again
                    api.getMovies();
                },
                complete: function complete() {
                    print.hideSpinner();
                },
                error: function error(_error2) {
                    alert("Oh no, there was an error posting your movie:", _error2);
                }
            });
        },

        patchMovie: function patchMovie(id, patchObj) {
            $.ajax({
                method: "PATCH",
                url: server + "/" + id,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify(patchObj),
                beforeSend: function beforeSend() {
                    print.showSpinner();
                },
                success: function success(response) {
                    console.log("successfully patched:", response);
                    //fetching all movies once again
                    api.getMovies();
                },
                complete: function complete() {
                    print.hideSpinner();
                },
                error: function error(_error3) {
                    alert("Oh no, there was an error patching your movie:", _error3);
                }
            });
        },

        deleteMovie: function deleteMovie(id) {
            $.ajax({
                method: "DELETE",
                url: server + "/" + id,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                beforeSend: function beforeSend() {
                    print.showSpinner();
                },
                success: function success() {
                    console.log("successfully deleted:");
                    //fetching all movies once again
                    api.getMovies();
                },
                complete: function complete() {
                    print.hideSpinner();
                },
                error: function error(_error4) {
                    alert("Oh no, there was an error deleting the movie:", _error4);
                }
            });
        }
    };
}();