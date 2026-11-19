-- Tags for the punishments database table, plus a second batch of curated ideas.
--
-- Hand-written (not generated): adding a defaulted column is a plain ALTER on
-- SQLite, and the seed rows below follow the same rules as 0003: stable
-- hand-written ids (they travel in ?ideas= links) and RFC3339 timestamps.

ALTER TABLE "PunishmentIdea" ADD COLUMN "tags" TEXT NOT NULL DEFAULT '';

UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,in-person,food,classic' WHERE "id" = 'pid_seed_waffle_house';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,multi-day,food,photo-proof' WHERE "id" = 'pid_seed_gas_station';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,food,video-proof,remote-friendly' WHERE "id" = 'pid_seed_raw_onion';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,food,video-proof' WHERE "id" = 'pid_seed_ghost_pepper';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,multi-day,food,remote-friendly' WHERE "id" = 'pid_seed_one_restaurant';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,in-person,food,video-proof' WHERE "id" = 'pid_seed_mystery_drink';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,wearable,photo-proof,classic' WHERE "id" = 'pid_seed_rival_jersey';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,one-day,wearable,in-person,embarrassing' WHERE "id" = 'pid_seed_mascot_suit';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,wearable,in-person,embarrassing,classic' WHERE "id" = 'pid_seed_sandwich_board';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,multi-day,wearable,embarrassing' WHERE "id" = 'pid_seed_tutu';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,wearable,photo-proof' WHERE "id" = 'pid_seed_hot_dog';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,wearable,outdoors,photo-proof' WHERE "id" = 'pid_seed_beach_suit';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,one-day,embarrassing,photo-proof,classic' WHERE "id" = 'pid_seed_senior_photos';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,outdoors,embarrassing,classic' WHERE "id" = 'pid_seed_street_corner';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,in-person,embarrassing' WHERE "id" = 'pid_seed_anthem';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,in-person,creative,embarrassing' WHERE "id" = 'pid_seed_open_mic';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,in-person,commissioner-duty' WHERE "id" = 'pid_seed_water_boy';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,in-person,embarrassing' WHERE "id" = 'pid_seed_read_lineups';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,one-day,in-person,commissioner-duty' WHERE "id" = 'pid_seed_host_draft';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,physical,food,video-proof' WHERE "id" = 'pid_seed_milk_mile';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,outdoors,physical,photo-proof' WHERE "id" = 'pid_seed_yard_tent';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,one-day,physical,outdoors,classic' WHERE "id" = 'pid_seed_5k_pads';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,one-day,remote-friendly,photo-proof' WHERE "id" = 'pid_seed_worst_movie';
UPDATE "PunishmentIdea" SET "tags" = 'free,multi-day,remote-friendly,photo-proof' WHERE "id" = 'pid_seed_4am_week';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,physical,outdoors,video-proof' WHERE "id" = 'pid_seed_polar_plunge';
UPDATE "PunishmentIdea" SET "tags" = 'free,multi-day,online,remote-friendly' WHERE "id" = 'pid_seed_bio_rewrite';
UPDATE "PunishmentIdea" SET "tags" = 'free,season-long,online,remote-friendly,classic' WHERE "id" = 'pid_seed_profile_pic';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,online,video-proof,remote-friendly' WHERE "id" = 'pid_seed_praise_video';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,online,remote-friendly,embarrassing' WHERE "id" = 'pid_seed_one_post';
UPDATE "PunishmentIdea" SET "tags" = 'free,multi-day,remote-friendly' WHERE "id" = 'pid_seed_ringtone';
UPDATE "PunishmentIdea" SET "tags" = 'free,season-long,remote-friendly,photo-proof' WHERE "id" = 'pid_seed_wallpaper';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,one-day,remote-friendly,family-friendly' WHERE "id" = 'pid_seed_donation';
UPDATE "PunishmentIdea" SET "tags" = 'free,one-day,in-person,family-friendly,photo-proof' WHERE "id" = 'pid_seed_food_bank';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,one-day,in-person,food' WHERE "id" = 'pid_seed_buy_dinner';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,commissioner-duty,remote-friendly' WHERE "id" = 'pid_seed_pay_dues';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,season-long,family-friendly' WHERE "id" = 'pid_seed_shelter_animal';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,permanent,classic' WHERE "id" = 'pid_seed_league_tattoo';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,multi-day,photo-proof' WHERE "id" = 'pid_seed_temp_tattoo';
UPDATE "PunishmentIdea" SET "tags" = 'costs-money,season-long,classic' WHERE "id" = 'pid_seed_shame_trophy';
UPDATE "PunishmentIdea" SET "tags" = 'free,permanent,commissioner-duty' WHERE "id" = 'pid_seed_hall_of_shame';
UPDATE "PunishmentIdea" SET "tags" = 'cheap,permanent,embarrassing' WHERE "id" = 'pid_seed_framed_start';
UPDATE "PunishmentIdea" SET "tags" = 'free,season-long,online,remote-friendly' WHERE "id" = 'pid_seed_team_name';

INSERT INTO "PunishmentIdea" ("id", "label", "category", "tags", "status", "createdAt", "approvedAt") VALUES
  ('pid_v2_spend_24_hours_in_an_ihop_mi', 'Spend 24 hours in an IHOP, minus one hour per pancake eaten', 'FOOD', 'in-person,one-day,food,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_a_beer_mile_one_drink_pe', 'Run a beer mile: one drink per quarter mile', 'ENDURANCE', 'physical,one-day,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_race_last_year_s_loser_in_a', 'Race last year''s loser in a beer mile; the loser repeats next year', 'ENDURANCE', 'physical,one-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_a_lemonade_stand_for_a_d', 'Run a lemonade stand for a day and give the profits to the champ', 'PUBLIC', 'in-person,one-day,outdoors,photo-proof,family-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_a_pink_lemonade_stand_an', 'Run a pink lemonade stand and donate the proceeds to charity', 'CHARITY', 'in-person,one-day,outdoors,family-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_hand_the_champ_control_of_yo', 'Hand the champ control of your social media for a week', 'DIGITAL', 'online,multi-day,embarrassing,remote-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_a_5k_in_a_ridiculous_cos', 'Run a 5K in a ridiculous costume chosen by the league', 'ENDURANCE', 'physical,one-day,costs-money,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_a_10k_in_a_full_mascot_c', 'Run a 10K in a full mascot costume', 'ENDURANCE', 'physical,one-day,photo-proof,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_perform_a_stand_up_comedy_se', 'Perform a stand-up comedy set while the league heckles', 'PUBLIC', 'in-person,one-day,embarrassing,creative,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_buy_a_custom_loser_trophy_an', 'Buy a custom loser trophy and display it at home all year', 'PERMANENT', 'costs-money,season-long,photo-proof,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_take_a_giant_stuffed_animal', 'Take a giant stuffed animal on a dinner date and pay the bill', 'PUBLIC', 'in-person,one-day,costs-money,embarrassing,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_sing_the_champ_s_chosen_kara', 'Sing the champ''s chosen karaoke song at a packed bar', 'PUBLIC', 'in-person,one-day,embarrassing,video-proof,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_sing_the_same_karaoke_song_o', 'Sing the same karaoke song on repeat until booed off', 'PUBLIC', 'in-person,one-day,embarrassing,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_hold_an_i_suck_at_fantasy_fo', 'Hold an ''I suck at fantasy football'' sign at a busy intersection', 'PUBLIC', 'in-person,one-day,outdoors,photo-proof,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_hold_a_shame_sign_for_two_ho', 'Hold a shame sign for two hours with no earbuds or phone', 'PUBLIC', 'in-person,one-day,outdoors,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_stand_on_a_corner_in_full_fo', 'Stand on a corner in full football pads and helmet holding a sign', 'PUBLIC', 'in-person,one-day,outdoors,wearable,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_walk_a_grocery_store_in_full', 'Walk a grocery store in full football gear holding a sign', 'PUBLIC', 'in-person,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_a_small_league_designed', 'Get a small league-designed tattoo within agreed size limits', 'PERMANENT', 'permanent,costs-money,photo-proof,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_a_tattoo_of_a_league_ins', 'Get a tattoo of a league inside joke', 'PERMANENT', 'permanent,costs-money,creative', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_an_i_suck_at_fantasy_foo', 'Get an ''I Suck at Fantasy Football'' tattoo', 'PERMANENT', 'permanent,costs-money,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_take_the_sat_as_an_adult_and', 'Take the SAT as an adult and share your score', 'ENDURANCE', 'costs-money,one-day,in-person,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_take_the_sat_the_morning_aft', 'Take the SAT the morning after the league party', 'ENDURANCE', 'costs-money,one-day,in-person,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_retake_the_act_and_post_your', 'Retake the ACT and post your score to the group chat', 'ENDURANCE', 'costs-money,one-day,in-person', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_take_the_gre_and_share_the_r', 'Take the GRE and share the results', 'ENDURANCE', 'costs-money,one-day,in-person', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_take_a_defensive_driving_cou', 'Take a defensive driving course', 'ENDURANCE', 'costs-money,one-day,in-person', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_take_the_wonderlic_test_and', 'Take the Wonderlic test and publish your score', 'DIGITAL', 'cheap,one-day,remote-friendly,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_donate_to_the_champ_s_chosen', 'Donate to the champ''s chosen charity and announce it online', 'CHARITY', 'costs-money,online,one-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_pay_a_fine_to_charity_for_ev', 'Pay a fine to charity for every week spent in last place', 'CHARITY', 'costs-money,season-long', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_hunted_by_the_league_in', 'Get hunted by the league in a paintball game', 'ENDURANCE', 'in-person,one-day,physical,outdoors', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_camp_overnight_outside_a_wal', 'Camp overnight outside a Walmart like it''s Black Friday', 'ENDURANCE', 'in-person,one-day,outdoors,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_a_terrible_haircut_chose', 'Get a terrible haircut chosen by the champ and tip well', 'WARDROBE', 'costs-money,multi-day,embarrassing,photo-proof,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_a_mullet_and_keep_it_for', 'Get a mullet and keep it for a month', 'WARDROBE', 'costs-money,multi-day,embarrassing,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_keep_an_i_suck_at_fantasy_fo', 'Keep an ''I suck at fantasy football'' bumper sticker on your car all year', 'PERMANENT', 'cheap,season-long,photo-proof,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_display_a_shame_license_plat', 'Display a shame license plate frame for a year', 'PERMANENT', 'cheap,season-long,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_a_personalized_license_p', 'Get a personalized license plate admitting you lost', 'PERMANENT', 'costs-money,season-long,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_dog_cone_for_the_enti', 'Wear a dog cone for the entire next draft', 'WARDROBE', 'cheap,one-day,in-person,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_pose_for_a_league_calendar_w', 'Pose for a league calendar with outfits chosen each month', 'PUBLIC', 'costs-money,creative,photo-proof,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_hand_out_the_shame_calendar', 'Hand out the shame calendar to every member as a holiday gift', 'PUBLIC', 'costs-money,creative,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_tuxedo_to_the_draft_a', 'Wear a tuxedo to the draft and serve everyone drinks', 'WARDROBE', 'in-person,one-day,wearable,commissioner-duty', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_take_the_longest_weekend_rou', 'Take the longest weekend round-trip bus ride possible, then come right back', 'ENDURANCE', 'costs-money,multi-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_fly_or_ride_a_train_to_a_ran', 'Fly or ride a train to a random city and immediately head home', 'ENDURANCE', 'costs-money,multi-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_rival_team_s_pennant', 'Wear a rival team''s pennant pin for a season', 'WARDROBE', 'cheap,season-long,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_draft_dressed_as_a_giant_gir', 'Draft dressed as a giant giraffe mascot', 'WARDROBE', 'in-person,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_play_the_recorder_in_public', 'Play the recorder in public until strangers give you $10', 'PUBLIC', 'in-person,one-day,outdoors,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_busk_at_a_busy_intersection', 'Busk at a busy intersection until you collect $20 for the champ', 'PUBLIC', 'in-person,one-day,outdoors,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_keep_a_toilet_trophy_engrave', 'Keep a toilet trophy engraved ''You played like #2''', 'PERMANENT', 'cheap,season-long,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_sit_for_a_department_store_p', 'Sit for a department store portrait in an outfit the league picks', 'PUBLIC', 'costs-money,one-day,photo-proof,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_let_the_champ_name_your_team', 'Let the champ name your team next season', 'DIGITAL', 'free,season-long,online,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_diaper_over_your_pant', 'Wear a diaper over your pants during the draft', 'WARDROBE', 'cheap,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_host_next_year_s_draft_and_h', 'Host next year''s draft and handle all food, drinks, and cleanup', 'FOOD', 'costs-money,in-person,commissioner-duty,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_buy_and_serve_the_league_s_d', 'Buy and serve the league''s drinks at the draft', 'FOOD', 'costs-money,in-person', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_toilet_bowl_champ_shi', 'Wear a ''Toilet Bowl Champ'' shirt during the draft', 'WARDROBE', 'cheap,one-day,wearable,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_decorated_toilet_seat', 'Wear a decorated toilet seat around your neck at the draft', 'WARDROBE', 'cheap,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_your_least_favorite_tea', 'Wear your least favorite team''s jersey to the draft', 'WARDROBE', 'costs-money,one-day,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_handmade_loser_shirt', 'Wear a handmade loser shirt every Sunday for a month', 'WARDROBE', 'cheap,multi-day,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_write_and_perform_a_song_hon', 'Write and perform a song honoring the champ', 'PUBLIC', 'free,creative,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_make_a_video_tribute_to_the', 'Make a video tribute to the champ and post it', 'DIGITAL', 'free,creative,online,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_hang_a_framed_portrait_of_th', 'Hang a framed portrait of the champ at home all year', 'PERMANENT', 'cheap,season-long,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_clean_the_champ_s_house_top', 'Clean the champ''s house top to bottom', 'ENDURANCE', 'free,in-person,one-day,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_detail_the_champ_s_car_insid', 'Detail the champ''s car inside and out', 'ENDURANCE', 'cheap,in-person,one-day,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_hold_a_press_conference_and', 'Hold a press conference and answer every league question', 'PUBLIC', 'free,in-person,one-day,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_enter_a_us_open_qualifier_an', 'Enter a US Open qualifier and play it out', 'ENDURANCE', 'costs-money,one-day,in-person,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_pose_for_a_body_issue_style', 'Pose for a body-issue style photo shoot (tasteful, clothes on)', 'PUBLIC', 'cheap,photo-proof,embarrassing,creative', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_walk_26_2_miles_of_laps_insi', 'Walk 26.2 miles of laps inside a Walmart or Sam''s Club', 'ENDURANCE', 'free,in-person,one-day,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_nfl_combine_drills_on_ca', 'Run NFL Combine drills on camera and try to beat it yearly', 'ENDURANCE', 'free,physical,video-proof,outdoors', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_a_non_face_piercing_chos', 'Get a (non-face) piercing chosen from an agreed list', 'PERMANENT', 'costs-money,permanent,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_an_oversized_flavor_fla', 'Wear an oversized Flavor Flav clock necklace to a diner', 'WARDROBE', 'cheap,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_record_a_sincere_apology_vid', 'Record a sincere apology video to the league', 'DIGITAL', 'free,online,video-proof,remote-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_appear_on_a_mailed_save_the', 'Appear on a mailed ''save the date'' postcard of shame', 'PUBLIC', 'costs-money,creative,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_use_a_team_name_the_league_v', 'Use a team name the league votes on all season', 'DIGITAL', 'free,season-long,online', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_draw_your_punishment_from_a', 'Draw your punishment from a hat of league-approved options', 'PUBLIC', 'free,one-day,in-person,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_spend_a_night_out_in_an_i_su', 'Spend a night out in an ''I Suck at Fantasy Football'' shirt', 'WARDROBE', 'cheap,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_buy_a_jumbotron_message_anno', 'Buy a jumbotron message announcing your loss at a game', 'PUBLIC', 'costs-money,one-day,embarrassing,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_eat_wings_with_the_restauran', 'Eat wings with the restaurant''s hottest sauce on camera', 'FOOD', 'cheap,one-day,food,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_pay_the_champ_s_league_dues', 'Pay the champ''s league dues next season', 'CHARITY', 'costs-money,season-long', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_buy_a_jersey_of_the_player_w', 'Buy a jersey of the player who cost you the most and wear it', 'WARDROBE', 'costs-money,wearable,season-long', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_serve_as_the_league_butler_a', 'Serve as the league butler all draft night', 'WARDROBE', 'free,in-person,one-day,commissioner-duty', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_put_your_photo_up_on_r_roast', 'Put your photo up on r/RoastMe', 'DIGITAL', 'free,online,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_host_the_end_of_season_party', 'Host the end-of-season party and supply the food', 'FOOD', 'costs-money,in-person,food', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_put_a_yard_sign_of_shame_on', 'Put a ''Yard Sign of Shame'' on your lawn for a week', 'PUBLIC', 'cheap,multi-day,outdoors,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_post_a_public_social_media_a', 'Post a public social media admission of your failure', 'DIGITAL', 'free,online,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_drink_a_league_chosen_nonalc', 'Drink a league-chosen nonalcoholic concoction', 'FOOD', 'cheap,one-day,food,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_suit_to_a_fast_food_r', 'Wear a suit to a fast food restaurant and order with a speech', 'PUBLIC', 'free,one-day,in-person,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_carry_the_trophy_of_shame_ev', 'Carry the trophy of shame everywhere for one weekend', 'PUBLIC', 'free,multi-day,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_cheerleader_outfit_to', 'Wear a cheerleader outfit to a local high school game', 'WARDROBE', 'cheap,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_change_your_profile_picture', 'Change your profile picture to the champ''s face for a month', 'DIGITAL', 'free,online,multi-day,remote-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_write_a_500_word_essay_on_wh', 'Write a 500-word essay on why you lost and read it aloud', 'DIGITAL', 'free,creative,remote-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_write_a_1_000_word_poem_prai', 'Write a 1,000-word poem praising the champ', 'DIGITAL', 'free,creative,remote-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_work_a_shift_at_a_fast_food', 'Work a shift at a fast food restaurant', 'ENDURANCE', 'free,one-day,in-person', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_full_banana_costume_t', 'Wear a full banana costume to the grocery store', 'WARDROBE', 'cheap,one-day,wearable,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_twirl_a_sign_for_a_local_bus', 'Twirl a sign for a local business on the roadside', 'PUBLIC', 'free,one-day,outdoors,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_spend_a_night_in_a_tent_in_y', 'Spend a night in a tent in your own backyard in December', 'ENDURANCE', 'free,one-day,outdoors', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_eat_a_whole_gallon_tub_of_ic', 'Eat a whole gallon tub of ice cream in one sitting', 'FOOD', 'cheap,one-day,food,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_eat_a_can_of_sardines_and_a', 'Eat a can of sardines and a raw onion on camera', 'FOOD', 'cheap,one-day,food,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_eat_a_baby_food_jar_tasting', 'Eat a baby food jar tasting flight blindfolded', 'FOOD', 'cheap,one-day,food,video-proof,family-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_finish_a_restaurant_s_giant', 'Finish a restaurant''s giant eating challenge', 'FOOD', 'costs-money,one-day,food,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_eat_only_fast_food_for_a_ful', 'Eat only fast food for a full week', 'FOOD', 'costs-money,multi-day,food', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_bake_cookies_for_every_leagu', 'Bake cookies for every league member and deliver them', 'FOOD', 'cheap,creative,family-friendly,commissioner-duty', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_cook_breakfast_for_the_champ', 'Cook breakfast for the champ every Sunday for a month', 'FOOD', 'cheap,multi-day,in-person', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_speedo_over_sweatpant', 'Wear a Speedo over sweatpants to the draft', 'WARDROBE', 'cheap,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_full_spandex_bodysuit', 'Wear a full Spandex bodysuit to the draft', 'WARDROBE', 'cheap,one-day,wearable,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_crocs_and_socks_combo', 'Wear a Crocs and socks combo to work for a week', 'WARDROBE', 'cheap,multi-day,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_crown_that_says_last', 'Wear a crown that says ''Last Place'' at every league event', 'WARDROBE', 'cheap,season-long,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_shave_your_eyebrows_halfway', 'Shave your eyebrows halfway for a week', 'WARDROBE', 'free,multi-day,photo-proof,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_grow_a_mustache_and_keep_it', 'Grow a mustache and keep it until the draft', 'WARDROBE', 'free,season-long,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_dye_your_hair_the_champ_s_te', 'Dye your hair the champ''s team colors', 'WARDROBE', 'cheap,multi-day,photo-proof,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_fanny_pack_full_of_le', 'Wear a fanny pack full of league stats everywhere for a month', 'WARDROBE', 'cheap,multi-day,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_go_door_to_door_telling_neig', 'Go door to door telling neighbors you lost', 'PUBLIC', 'free,one-day,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_read_a_poem_praising_the_cha', 'Read a poem praising the champ at an open mic night', 'PUBLIC', 'free,one-day,embarrassing,creative', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_dance_in_the_middle_of_a_mal', 'Dance in the middle of a mall for one full song', 'PUBLIC', 'free,one-day,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_serenade_the_champ_outside_t', 'Serenade the champ outside their house', 'PUBLIC', 'free,one-day,embarrassing,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_read_the_champ_s_wikipedia_s', 'Read the champ''s Wikipedia-style bio at a family dinner', 'PUBLIC', 'free,one-day,family-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_a_free_hugs_sign_for_an', 'Run a ''free hugs'' sign for an hour at a park', 'PUBLIC', 'free,one-day,outdoors', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_teach_a_free_fantasy_footbal', 'Teach a free fantasy football class at the library', 'PUBLIC', 'free,one-day,creative', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_pick_up_litter_along_a_highw', 'Pick up litter along a highway with an adopt-a-highway crew', 'CHARITY', 'free,one-day,outdoors,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_volunteer_a_full_day_at_a_fo', 'Volunteer a full day at a food bank', 'CHARITY', 'free,one-day,in-person,family-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_donate_blood_and_post_the_ba', 'Donate blood and post the bandage photo', 'CHARITY', 'free,one-day,photo-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_volunteer_at_an_animal_shelt', 'Volunteer at an animal shelter for a weekend', 'CHARITY', 'free,multi-day,in-person,family-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_shovel_the_champ_s_driveway', 'Shovel the champ''s driveway all winter', 'ENDURANCE', 'free,season-long,physical,outdoors', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_mow_the_champ_s_lawn_for_a_m', 'Mow the champ''s lawn for a month', 'ENDURANCE', 'free,multi-day,physical,outdoors', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_do_one_push_up_for_every_poi', 'Do one push-up for every point you scored in the final week', 'ENDURANCE', 'free,physical,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_swim_in_a_cold_lake_in_janua', 'Swim in a cold lake in January (lifeguard present)', 'ENDURANCE', 'free,one-day,outdoors,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_a_mile_in_flip_flops_on', 'Run a mile in flip flops on a track', 'ENDURANCE', 'free,one-day,physical', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_hike_up_a_stadium_s_stairs_i', 'Hike up a stadium''s stairs in full pads', 'ENDURANCE', 'free,one-day,physical,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_watch_every_fast_and_furious', 'Watch every Fast and Furious movie back to back', 'ENDURANCE', 'cheap,one-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_watch_a_full_season_of_a_rea', 'Watch a full season of a reality show the champ picks', 'ENDURANCE', 'free,multi-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_listen_to_only_one_song_chos', 'Listen to only one song chosen by the champ for a day', 'ENDURANCE', 'free,one-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_read_a_book_the_champ_picks', 'Read a book the champ picks and write a report', 'ENDURANCE', 'cheap,multi-day,creative', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_change_your_league_avatar_to', 'Change your league avatar to an unflattering photo all season', 'DIGITAL', 'free,online,season-long', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_post_weekly_power_rankings_w', 'Post weekly power rankings with roasts of yourself', 'DIGITAL', 'free,season-long,online,commissioner-duty', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_write_the_league_newsletter', 'Write the league newsletter every week next season', 'DIGITAL', 'free,season-long,creative,commissioner-duty', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_run_the_league_as_commission', 'Run the league as commissioner next season', 'DIGITAL', 'free,season-long,commissioner-duty', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_set_your_phone_wallpaper_to', 'Set your phone wallpaper to the champ for a year', 'DIGITAL', 'free,season-long,online', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_post_a_linkedin_update_annou', 'Post a LinkedIn update announcing your fantasy failure', 'DIGITAL', 'free,online,embarrassing', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_change_your_email_signature', 'Change your email signature to admit last place for a month', 'DIGITAL', 'free,online,multi-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_write_a_glowing_five_star_re', 'Write a glowing five-star review of the champ on the group chat', 'DIGITAL', 'free,online,creative', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_start_every_group_chat_messa', 'Start every group chat message with ''Hail the champ'' for a month', 'DIGITAL', 'free,online,multi-day', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_make_a_tiktok_dance_video_in', 'Make a TikTok dance video in a costume', 'DIGITAL', 'free,online,video-proof', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_set_your_ringtone_to_the_cha', 'Set your ringtone to the champ''s voice for a season', 'DIGITAL', 'free,season-long', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_make_a_highlight_reel_of_you', 'Make a highlight reel of your worst lineup decisions', 'DIGITAL', 'free,creative,video-proof,online', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_get_your_name_engraved_on_a', 'Get your name engraved on a permanent loser plaque', 'PERMANENT', 'cheap,permanent,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_plant_a_tree_in_the_champ_s', 'Plant a tree in the champ''s honor with a plaque', 'PERMANENT', 'cheap,permanent,outdoors,family-friendly', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_commission_a_portrait_of_the', 'Commission a portrait of the champ for the league''s man cave', 'PERMANENT', 'costs-money,permanent,creative', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_wear_a_loser_ring_at_every_l', 'Wear a loser ring at every league gathering forever', 'PERMANENT', 'cheap,permanent,wearable', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_draft_last_next_year_no_matt', 'Draft last next year no matter what', 'PERMANENT', 'free,season-long,classic', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00'),
  ('pid_v2_lose_your_first_round_pick_t', 'Lose your first-round pick to the champ next season', 'DIGITAL', 'free,season-long', 'APPROVED', '2026-11-19T00:00:00.000+00:00', '2026-11-19T00:00:00.000+00:00');
