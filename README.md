# 📚 LearnTime — Personalized Video Learning Planner

LearnTime is a web-based study planning application that helps students plan
YouTube-based learning according to their available study time.

Instead of simply showing the total duration of a YouTube playlist, LearnTime
analyzes the videos and creates a simple personalized study plan based on:

- Total number of videos
- Total video duration
- Daily available study time
- Playback speed
- Number of videos that can be completed each day
- Expected completion date

The project uses the YouTube Data API to retrieve playlist and video
information dynamically.

---

## 🎯 Problem Statement

Students often save long YouTube playlists for learning but do not know:

- How long the complete playlist will take
- How much content they should watch every day
- How playback speed affects their learning time
- How many days are required to complete the playlist

LearnTime solves this problem by converting a YouTube playlist into a
simple and personalized learning schedule.

---

## 💡 Solution

The user provides a YouTube playlist URL and enters their daily available
study time.

LearnTime then:

1. Extracts the playlist ID from the URL.
2. Fetches playlist information using the YouTube Data API.
3. Retrieves the videos from the playlist.
4. Retrieves the duration of each video.
5. Converts YouTube's ISO 8601 duration format into seconds.
6. Calculates the effective watch time based on playback speed.
7. Groups videos according to the user's daily available time.
8. Calculates the number of days required.
9. Displays the expected completion date.

---

## ✨ Features

### 1. YouTube Playlist Analysis

Users can paste a YouTube playlist URL.

Example:

    https://www.youtube.com/playlist?list=PLAYLIST_ID

The application extracts the playlist ID and uses the YouTube Data API
to retrieve playlist information.

---

### 2. Playlist Overview

After analyzing a playlist, LearnTime displays:

- Playlist title
- Number of videos
- Total playlist duration
- Average video duration

Example:

    Videos: 25
    Total Duration: 18h 35m
    Average Video: 44 min

---

### 3. Personalized Study Settings

Users can enter:

- Hours available per day
- Additional minutes available per day
- Preferred playback speed

Example:

    Hours per day: 2
    Minutes: 30
    Playback speed: 1.5x

---

### 4. Playback Speed Calculation

LearnTime calculates the effective watch time based on playback speed.

For example:

    Original duration = 60 minutes
    Playback speed = 1.5x

    Effective watch time = 60 / 1.5
                         = 40 minutes

This helps students understand how playback speed changes the total
learning time.

---

### 5. Smart Study Plan

The application groups videos according to the user's available daily time.

For example:

    Daily available time = 2 hours

The application keeps adding videos to a day until adding another video
would exceed the available time.

The remaining videos are moved to the next day.

---

### 6. Completion Date

After calculating the number of required study days, LearnTime estimates
the date on which the playlist can be completed.

---

### 7. Watch Time Comparison

The application compares:

- Normal 1x watch time
- Selected playback speed watch time

This allows users to understand how much time they can save using
different playback speeds.

---

### 8. Responsive Design

The interface is designed to work on:

- Desktop
- Laptop
- Tablet
- Mobile devices

CSS media queries are used to adjust the layout for smaller screens.

---

# 🛠️ Technologies Used

## Frontend

- HTML5
- CSS3
- JavaScript

## API

- YouTube Data API v3

## Development Tools

- Visual Studio Code
- Git
- GitHub
- Live Server

---

# 🏗️ Project Structure

```text
LearnTime/
│
├── index.html
├── style.css
├── script.js
├── config.js
├── .gitignore
└── README.md
