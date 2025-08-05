 /* eslint-disable @next/next/no-img-element */
import React from "react";

export default function StatsInformation() {
  return (
    <>
      <div className="mt-10 md:mt-0 text-xl font-extrabold">✨ Stats ✨</div>
      <div className="carousel w-75 rounded-box shadow-md mt-4 bg-base-100">
        <div id="id1" className="carousel-item relative w-full">
          <div>
            <figure>
              <img
                src="https://img.daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.webp"
                alt="Shoes"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Red Tetris</h2>
              <p>
                A 42 project where I created a Tetris game using JavaScript and
                NextJS. The game can be played by multiple players. I had a time
                constraint so the design is simple. It is not responsive.
              </p>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    window.open("https://red-tetris-iota.vercel.app/", "_blank")
                  }
                >
                  Try it!
                </button>
              </div>
            </div>
          </div>
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href={`#id2`}></a>
            <a href={`#id2`} className="btn btn-circle btn-ghost">
              ❯
            </a>
          </div>
        </div>
        <div id="id2" className="carousel-item relative w-full">
          <div>
            <figure>
              <img
                src="https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.webp"
                alt="Shoes"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Matcha</h2>
              <p>
                Another 42 project where I have to make a dating app. It is a
                work in progress. I plan to make the front in NextJS +
                Typescript, my partner will do the back in Go. For now I have
                started to do the Figma.
              </p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">See it!</button>
              </div>
            </div>
          </div>
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href={`#id1`} className="btn btn-circle btn-ghost">
              ❮
            </a>
            <a href={`#id3`} className="btn btn-circle btn-ghost">
              ❯
            </a>
          </div>
        </div>
        <div id="id3" className="carousel-item relative w-full">
          <div>
            <figure>
              <img
                src="https://img.daisyui.com/images/stock/photo-1572635148818-ef6fd45eb394.webp"
                alt="Shoes"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Matcha</h2>
              <p>
                Another 42 project where I have to make a dating app. It is a
                work in progress. I plan to make the front in NextJS +
                Typescript, my partner will do the back in Go. For now I have
                started to do the Figma.
              </p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">See it!</button>
              </div>
            </div>
          </div>
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href={`#id2`} className="btn btn-circle btn-ghost">
              ❮
            </a>
            <a href={`#id1`}></a>
          </div>
        </div>
      </div>
    </>
  );
}
