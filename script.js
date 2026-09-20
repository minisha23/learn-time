let videos = [];
let totalSeconds = 0;


// Get playlist ID from YouTube URL
function getPlaylistId(url) {

    try {
        let link = new URL(url);
        return link.searchParams.get("list");
    } catch (error) {
        return null;
    }
}


// Analyze playlist
async function analyzePlaylist() {

    let url = document.getElementById("playlistUrl").value.trim();
    let playlistId = getPlaylistId(url);
    let message = document.getElementById("message");

    if (!playlistId) {
        message.textContent =
            "Please enter a valid YouTube playlist URL.";
        return;
    }

    message.textContent = "Loading playlist...";

    try {

        // Call our Vercel backend
        let response =
            await fetch(`/api/youtube?playlistId=${playlistId}`);

        let data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.error || "Could not load playlist.";
            return;
        }

        // Store videos
        videos = data.videos.map(function(video) {

            return {
                title: video.title,
                seconds: convertDuration(video.duration)
            };

        });

        // Calculate total duration
        totalSeconds = 0;

        videos.forEach(function(video) {
            totalSeconds += video.seconds;
        });


        // Show result section
        document
            .getElementById("result")
            .classList.remove("hidden");


        // Playlist title
        document.getElementById("playlistTitle").textContent =
            data.title;


        // Number of videos
        document.getElementById("videoCount").textContent =
            videos.length;


        // Total duration
        document.getElementById("totalTime").textContent =
            formatTime(totalSeconds);


        // Average duration
        if (videos.length > 0) {

            document.getElementById("averageTime").textContent =
                formatTime(totalSeconds / videos.length);

        } else {

            document.getElementById("averageTime").textContent =
                "0 min";
        }


        message.textContent = "";

        // Create study plan
        createPlan();

    } catch (error) {

        console.log(error);

        message.textContent =
            "Something went wrong. Please try again.";
    }
}



// Convert YouTube ISO duration to seconds
function convertDuration(duration) {

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    let hourMatch = duration.match(/(\d+)H/);
    let minuteMatch = duration.match(/(\d+)M/);
    let secondMatch = duration.match(/(\d+)S/);

    if (hourMatch) {
        hours = parseInt(hourMatch[1]);
    }

    if (minuteMatch) {
        minutes = parseInt(minuteMatch[1]);
    }

    if (secondMatch) {
        seconds = parseInt(secondMatch[1]);
    }

    return (hours * 3600) +
           (minutes * 60) +
           seconds;
}



// Convert seconds into readable time
function formatTime(seconds) {

    seconds = Math.round(seconds);

    let hours = Math.floor(seconds / 3600);

    let minutes =
        Math.floor((seconds % 3600) / 60);

    if (hours > 0) {

        return hours + "h " +
               minutes + "m";

    }

    return minutes + " min";
}



// Create personalized study plan
function createPlan() {

    if (videos.length === 0) {
        return;
    }

    let hours =
        parseInt(document.getElementById("hours").value) || 0;

    let minutes =
        parseInt(document.getElementById("minutes").value) || 0;

    let speed =
        parseFloat(document.getElementById("speed").value) || 1;


    // Total study time available per day
    let dailyMinutes =
        (hours * 60) + minutes;


    if (dailyMinutes <= 0) {

        document.getElementById("daysNeeded").textContent = "-";

        document.getElementById("videosPerDay").textContent = "-";

        document.getElementById("finishDate").textContent = "-";

        document.getElementById("schedule").innerHTML =
            "<p>Please enter your daily study time.</p>";

        return;
    }


    // Convert daily time to seconds
    let dailySeconds =
        dailyMinutes * 60;


    let days = [];

    let currentDay = {
        videos: [],
        seconds: 0
    };


    /*
        Go through every video.

        A video can now be split across multiple days
        if it is longer than the remaining daily time.
    */

    videos.forEach(function(video, videoIndex) {

        let remainingSeconds =
            video.seconds / speed;


        while (remainingSeconds > 0) {

            let availableSeconds =
                dailySeconds - currentDay.seconds;


            // If today's time is already full,
            // start a new day.
            if (availableSeconds <= 0) {

                days.push(currentDay);

                currentDay = {
                    videos: [],
                    seconds: 0
                };

                availableSeconds = dailySeconds;
            }


            // Time of this video that can fit today
            let watchSeconds =
                Math.min(
                    remainingSeconds,
                    availableSeconds
                );


            currentDay.videos.push({
                index: videoIndex,
                title: video.title,
                seconds: watchSeconds,
                remainingAfter:
                    remainingSeconds - watchSeconds
            });


            currentDay.seconds += watchSeconds;

            remainingSeconds -= watchSeconds;

        }

    });


    // Add final day
    if (currentDay.videos.length > 0) {

        days.push(currentDay);

    }


    // Number of study days
    document.getElementById("daysNeeded").textContent =
        days.length;


    /*
        Average videos per day.

        We count unique videos touched on each day,
        so a split video is not counted twice.
    */

    let totalDailyVideoCount = 0;


    days.forEach(function(day) {

        let uniqueVideos = new Set();

        day.videos.forEach(function(segment) {

            uniqueVideos.add(segment.index);

        });

        day.videoCount =
            uniqueVideos.size;

        totalDailyVideoCount +=
            uniqueVideos.size;

    });


    let averageVideos =
        totalDailyVideoCount / days.length;


    document.getElementById("videosPerDay").textContent =
        averageVideos.toFixed(1);


    // Calculate finish date
    let finishDate = new Date();

    finishDate.setDate(
        finishDate.getDate() + days.length - 1
    );


    let dateText =
        finishDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });


    document.getElementById("finishDate").textContent =
        dateText;


    // Display daily schedule
    let schedule =
        document.getElementById("schedule");

    schedule.innerHTML = "";


    days.forEach(function(day, index) {

        let dayBox =
            document.createElement("div");

        dayBox.className = "day";


        // Day heading
        let title =
            document.createElement("h3");

        title.textContent =
            "Day " + (index + 1);


        // Video count
        let videoCount =
            document.createElement("p");

        videoCount.innerHTML =
            "<b>" +
            day.videoCount +
            "</b> video" +
            (day.videoCount !== 1 ? "s" : "");


        // Watch time
        let timeText =
            document.createElement("p");

        timeText.textContent =
            "Study time: " +
            formatTime(day.seconds);


        dayBox.appendChild(title);

        dayBox.appendChild(videoCount);

        dayBox.appendChild(timeText);


        /*
            Show what to watch on this day
        */

        let videoList =
            document.createElement("ul");

        day.videos.forEach(function(segment) {

            let item =
                document.createElement("li");


            let segmentMinutes =
                Math.round(segment.seconds / 60);


            let isContinuation =
                segment.remainingAfter > 0;


            let text =
                segment.title +
                " — " +
                segmentMinutes +
                " min";


            if (isContinuation) {

                text += " (continue tomorrow)";

            }


            item.textContent = text;

            videoList.appendChild(item);

        });


        dayBox.appendChild(videoList);

        schedule.appendChild(dayBox);

    });


    // Update speed comparison
    updateSpeedComparison(speed);
}
// Compare different playback speeds
function updateSpeedComparison(speed) {

    let normalTime =
        formatTime(totalSeconds);

    let fastTime =
        formatTime(totalSeconds / speed);


    document.getElementById("normalTime").textContent =
        normalTime;


    document.getElementById("currentSpeed").textContent =
        speed + "x";


    document.getElementById("fastTime").textContent =
        fastTime;
}



// Create plan whenever settings change
document
    .getElementById("hours")
    .addEventListener("input", createPlan);

document
    .getElementById("minutes")
    .addEventListener("input", createPlan);

document
    .getElementById("speed")
    .addEventListener("change", createPlan);