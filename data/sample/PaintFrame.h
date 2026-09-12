#pragma once
#include <iostream>
#include "frame.h"

class ToolBar;
class PaintPanel;
using namespace std;
class PaintFrame : public Frame
{
public:
	PaintFrame();
	PaintFrame(string title, int width, int height);
	void ComponentInit();
	void repaint(HDC dc) override;

protected:
	ToolBar* myToolBar_;
	PaintPanel* myPanel_;
//
//	//set함수
//	void setFigure();
//	void setCheckBox();
//
//	//override함수
//	bool eventHandler(ActionEvent) override;
//	void repaint(HDC) override;
//	void actionPerformed(ActionEvent) override;
//
//	//
//	MPoint CheckGrid(MPoint p,int size);
};

