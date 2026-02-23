(ns example.core)

(defn greet
  "Return a greeting message for `name`."
  [name]
  (str "Hello, " name "!"))

(comment
  ;; Try editing this file in PI to trigger auto paren-repair and cljfmt.
  (greet "PI"))

