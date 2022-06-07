(ns kitty
  (:require [clojure.string :as string]
            [cljs.nodejs :as node]))

(def fs (node/require "fs"))

(defn kitties []
  (.split
    (.readFileSync fs (str "art/kitties.txt") "ascii")
    "\n\n"))

(defn random-kitty []
  (string/trim (rand-nth (kitties))))

(defn -main [&args]
  (println (random-kitty)))

(set! *main-cli-fn* -main)
