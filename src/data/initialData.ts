import type { Series, Episode } from "../types";

export const initialDummySeries: Series[] = [
  {
    id: 1,
    title: "Demon Slayer: Kimetsu no Yaiba",
    type: "Anime",
    poster: "/photo_7_2026-08-03_14-02-56.jpg",
    genre: "Action, Adventure, Fantasy",
    year: 2019,
    status: "Watching",
    description:
      "Tanjiro Kamado joins the Demon Slayer Corps after his family is slaughtered and his sister Nezuko is turned into a demon.",
  },
  {
    id: 2,
    title: "Avengers: Doomsday",
    type: "Movie",
    poster: "/photo_2_2026-08-03_14-02-56.jpg",
    genre: "Action, Sci-Fi, Superhero",
    duration: "2h 30m", // <--- Menggunakan durasi untuk film
    status: "Plan to Watch",
    description:
      "Earth's mightiest heroes must face a new, terrifying threat in the form of Doctor Doom.",
  },
  {
    id: 3,
    title: "Dune: Part Two",
    type: "Movie",
    poster: "/photo_3_2026-08-03_14-02-56.jpg",
    genre: "Sci-Fi, Adventure, Drama",
    duration: "2h 46m", // <--- Menggunakan durasi untuk film
    status: "Completed",
    description:
      "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
  },
  {
    id: 4,
    title: "Stranger Things",
    type: "TV Series",
    poster: "/photo_4_2026-08-03_14-02-56.jpg",
    genre: "Sci-Fi, Horror, Drama",
    year: 2016,
    status: "Watching",
    description:
      "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
  },
  {
    id: 5,
    title: "One Piece",
    type: "Anime",
    poster: "/photo_5_2026-08-03_14-02-56.jpg",
    genre: "Action, Adventure, Comedy",
    year: 1999,
    status: "Watching",
    description:
      "Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger.",
  },
  {
    id: 6,
    title: "Interstellar",
    type: "Movie",
    poster: "/photo_6_2026-08-03_14-02-56.jpg",
    genre: "Sci-Fi, Drama",
    duration: "2h 49m",
    status: "Completed",
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
  {
    id: 7,
    title: "Swapped",
    type: "Movie",
    poster: "/photo_1_2026-08-03_14-02-56.jpg",
    genre: "Animation, Adventure, Family",
    duration: "1h 45m",
    status: "Plan to Watch",
    description:
      "A magical adventure where unexpected friends must navigate a world of wonders to find their way back home.",
  },
];

export const initialDummyEpisodes: Episode[] = [
  // Episodes for Demon Slayer (id: 1)
  {
    id: 101,
    seriesId: 1,
    season: 1,
    episodeNumber: 1,
    title: "Cruelty",
    platform: "Netflix",
    link: "https://netflix.com",
    watched: true,
  },
  {
    id: 102,
    seriesId: 1,
    season: 1,
    episodeNumber: 2,
    title: "Trainer Sakonji Urokodaki",
    platform: "Netflix",
    link: "https://netflix.com",
    watched: true,
  },
  {
    id: 103,
    seriesId: 1,
    season: 1,
    episodeNumber: 3,
    title: "Sabito and Makomo",
    platform: "Netflix",
    link: "https://netflix.com",
    watched: false,
  },

  // Episodes for Stranger Things (id: 4)
  {
    id: 401,
    seriesId: 4,
    season: 1,
    episodeNumber: 1,
    title: "Chapter One: The Vanishing of Will Byers",
    platform: "Netflix",
    link: "https://netflix.com",
    watched: true,
  },
  {
    id: 402,
    seriesId: 4,
    season: 1,
    episodeNumber: 2,
    title: "Chapter Two: The Weirdo on Maple Street",
    platform: "Netflix",
    link: "https://netflix.com",
    watched: false,
  },

  // Episodes for One Piece (id: 5)
  {
    id: 501,
    seriesId: 5,
    season: 1,
    episodeNumber: 1,
    title: "I'm Luffy! The Man Who Will Become the Pirate King!",
    platform: "Crunchyroll",
    link: "https://crunchyroll.com",
    watched: true,
  },
  {
    id: 502,
    seriesId: 5,
    season: 1,
    episodeNumber: 2,
    title: "Enter the Great Swordsman! Pirate Hunter Roronoa Zoro!",
    platform: "Crunchyroll",
    link: "https://crunchyroll.com",
    watched: true,
  },
  {
    id: 503,
    seriesId: 5,
    season: 1,
    episodeNumber: 3,
    title: "Morgan versus Luffy! Who's the Mysterious Pretty Girl?",
    platform: "Crunchyroll",
    link: "https://crunchyroll.com",
    watched: false,
  },
];
