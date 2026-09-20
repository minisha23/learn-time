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


// Analyze YouTube playlist
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

        let response =
            await fetch(`/api/youtube?playlistId=${playlistId}`);

        let data = await response.json();

        if (!response.ok) {
            message.textContent =
                data.error || "Could not load playlist.";
            return;
        }

        videos = data.videos.map(function(video) {
            return {
                title: video.title,
                seconds: convertDuration(video.duration)
            };
        });

        totalSeconds = 0;

        videos.forEach(function(video) {
            totalSeconds += video.seconds;
        });

        document
            .getElementById("result")
            .classList.remove("hidden");

        document.getElementById("playlistTitle").textContent =
            data.title;

        document.getElementById("videoCount").textContent =
            videos.length;

        document.getElementById("totalTime").textContent =
            formatTime(totalSeconds);

        document.getElementById("averageTime").textContent =
            videos.length > 0
                ? formatTime(totalSeconds / videos.length)
                : "0 min";

        message.textContent = "";

        createPlan();

    } catch (error) {

        console.error("Analyze error:", error);

        message.textContent =
            "Error: " + error.message;
    }
}


// Convert YouTube duration into seconds
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


// Format seconds into readable time
function formatTime(seconds) {

    seconds = Math.round(seconds);

    let hours = Math.floor(seconds / 3600);

    let minutes =
        Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return hours + "h " + minutes + "m";
    }

    return minutes + " min";
}


// Create study plan
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

    let dailySeconds =
        dailyMinutes * 60;

    let days = [];

    let currentDay = {
        videos: [],
        seconds: 0
    };


    // Split videos across days when necessary
    videos.forEach(function(video, videoIndex) {

        let remainingSeconds =
            video.seconds / speed;

        while (remainingSeconds > 0) {

            let availableSeconds =
                dailySeconds - currentDay.seconds;

            if (availableSeconds <= 0) {

                days.push(currentDay);

                currentDay = {
                    videos: [],
                    seconds: 0
                };

                availableSeconds = dailySeconds;
            }

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


    if (currentDay.videos.length > 0) {
        days.push(currentDay);
    }


    // Number of days
    document.getElementById("daysNeeded").textContent =
        days.length;


    // Average videos touched per day
    let totalDailyVideoCount = 0;

    days.forEach(function(day) {

        let uniqueVideos = new Set();

        day.videos.forEach(function(segment) {
            uniqueVideos.add(segment.index);
        });

        day.videoCount = uniqueVideos.size;

        totalDailyVideoCount += uniqueVideos.size;
    });

    let averageVideos =
        totalDailyVideoCount / days.length;

    document.getElementById("videosPerDay").textContent =
        averageVideos.toFixed(1);


    // Finish date
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


    // Display schedule
    let schedule =
        document.getElementById("schedule");

    schedule.innerHTML = "";


    days.forEach(function(day, index) {

        let dayBox =
            document.createElement("div");

        dayBox.className = "day";


        let title =
            document.createElement("h3");

        title.textContent =
            "Day " + (index + 1);


        let videoCount =
            document.createElement("p");

        videoCount.innerHTML =
            "<b>" +
            day.videoCount +
            "</b> video" +
            (day.videoCount !== 1 ? "s" : "");


        let timeText =
            document.createElement("p");

        timeText.textContent =
            "Study time: " +
            formatTime(day.seconds);


        dayBox.appendChild(title);
        dayBox.appendChild(videoCount);
        dayBox.appendChild(timeText);


        // Show videos for this day
        let videoList =
            document.createElement("ul");

        day.videos.forEach(function(segment) {

            let item =
                document.createElement("li");

            let segmentMinutes =
                Math.round(segment.seconds / 60);

            let text =
                segment.title +
                " — " +
                segmentMinutes +
                " min";

            if (segment.remainingAfter > 0) {
                text += " (continue tomorrow)";
            }

            item.textContent = text;

            videoList.appendChild(item);
        });

        dayBox.appendChild(videoList);

        schedule.appendChild(dayBox);
    });


    updateSpeedComparison(speed);
}


// Speed comparison
function updateSpeedComparison(speed) {

    document.getElementById("normalTime").textContent =
        formatTime(totalSeconds);

    document.getElementById("currentSpeed").textContent =
        speed + "x";

    document.getElementById("fastTime").textContent =
        formatTime(totalSeconds / speed);
}


// Update plan when settings change
document
    .getElementById("hours")
    .addEventListener("input", createPlan);

document
    .getElementById("minutes")
    .addEventListener("input", createPlan);

document
    .getElementById("speed")
    .addEventListener("change", createPlan);