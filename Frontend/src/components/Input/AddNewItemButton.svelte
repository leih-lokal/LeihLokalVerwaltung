<button on:click>+</button>

<style>
  button {
    width: 70px;
    height: 70px;
    background-color: var(--blue);
    border-width: 0px;
    border-radius: 50%;
    box-shadow: 0 6px 10px 0 #000000;
    transition: all 0.1s ease-in-out;

    font-size: 50px;
    color: white;
    text-align: center;
    line-height: 0px;
    padding-bottom: -20px;

    position: absolute;
    right: 50px;
    bottom: 50px;
    cursor: pointer;
  }

  button:focus {
    box-shadow: 0 6px 14px 0 #000000;
    transform: scale(1.05);
  }
</style>
