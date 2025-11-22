"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NodeViewWrapper, ReactNodeViewProps } from "@tiptap/react";
import { Move } from "lucide-react";

interface YoutubeEmbedComponentProps extends ReactNodeViewProps {}

const MIN_WIDTH = 320;
const MAX_WIDTH = 960;

const YoutubeEmbedComponent: React.FC<YoutubeEmbedComponentProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { src, width, height } = node.attrs;

  const aspectRatio = useMemo(() => {
    const numericWidth = Number(width) || 640;
    const numericHeight = Number(height) || 360;
    if (!numericWidth || !numericHeight) {
      return 9 / 16;
    }
    return numericHeight / numericWidth;
  }, [width, height]);

  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: Number(width) || 640,
    height: Number(height) || 360,
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, width: Number(width) || 640 });

  useEffect(() => {
    const normalizedWidth = Number(width) || 640;
    const normalizedHeight =
      Number(height) || Math.round(normalizedWidth * aspectRatio);
    setDimensions((prev) => {
      if (prev.width === normalizedWidth && prev.height === normalizedHeight) {
        return prev;
      }
      return {
        width: normalizedWidth,
        height: normalizedHeight,
      };
    });
    startPos.current = { x: 0, width: normalizedWidth };
  }, [width, height, aspectRatio]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const currentWidth = wrapperRef.current?.offsetWidth ?? dimensions.width;
      startPos.current = {
        x: event.clientX,
        width: currentWidth,
      };

      setIsResizing(true);
    },
    [dimensions.width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = event.clientX - startPos.current.x;
      const proposedWidth = startPos.current.width + deltaX;
      const clampedWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, Math.round(proposedWidth))
      );
      const clampedHeight = Math.round(clampedWidth * aspectRatio);

      setDimensions({ width: clampedWidth, height: clampedHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);

      updateAttributes({
        width: dimensions.width,
        height: dimensions.height,
      });

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    aspectRatio,
    dimensions.height,
    dimensions.width,
    isResizing,
    updateAttributes,
  ]);

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`youtube-embed-wrapper relative ${
        selected ? "selected group" : ""
      }`}
      style={{
        maxWidth: `${dimensions.width}px`,
        width: "100%",
        margin: "0 auto",
      }}
    >
      <div
        className="youtube-embed-inner relative overflow-hidden rounded-lg bg-black"
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
        }}
      >
        <iframe
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
          className="rounded-lg"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />

        <div
          className={`absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white transition-opacity ${
            selected ? "opacity-90" : "opacity-0 pointer-events-none"
          }`}
          onMouseDown={handleMouseDown}
          title="Arrastra para redimensionar"
        >
          <Move className="h-3 w-3" />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default YoutubeEmbedComponent;
