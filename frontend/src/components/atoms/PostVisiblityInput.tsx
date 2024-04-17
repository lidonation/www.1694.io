import React from 'react'

const PostVisiblityInput = () => {
  return (
    <div className="flex flex-col items-start justify-center mt-5">
        <p>Set Visibility</p>
        <div className="flex flex-row items-center gap-3 ml-3">
          <input type="radio" />
          <label>Everyone</label>
          <input type="radio" />
          <label>DReps Only</label>
        </div>
      </div>
  )
}

export default PostVisiblityInput